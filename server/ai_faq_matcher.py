import difflib
import hashlib
import re


def normalize_question(text):
    cleaned = re.sub(r"\s+", "", str(text or "").lower())
    return re.sub(r"[，。！？、,.!?；;：:]+", "", cleaned)


def cache_key(agent_id, question, auth_state="any"):
    raw = f"{agent_id}|{auth_state}|{normalize_question(question)}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def question_grams(text):
    normalized = normalize_question(text)
    if not normalized:
        return set()
    if len(normalized) <= 2:
        return {normalized}
    return {normalized[i:i + 2] for i in range(len(normalized) - 1)}


def question_concepts(text):
    value = normalize_question(text)
    concepts = set()
    checks = {
        "flow": ("流程", "步骤", "怎么", "怎样", "如何", "完整", "操作"),
        "auth": ("认证", "统一身份", "身份认证"),
        "effect": ("影响", "有什么用", "作用"),
        "schedule": ("课表", "课程", "选课"),
        "recommend": ("推荐", "优先买", "值得", "比较", "适合"),
        "note": ("资料", "笔记", "历年卷", "试卷", "真题"),
        "rank": ("筛选", "下载量", "相关性", "高质量"),
        "budget": ("预算", "价格", "便宜"),
    }
    for name, words in checks.items():
        if any(word in value for word in words):
            concepts.add(name)
    if ("买" in value or "购买" in value or "下单" in value or "交易" in value) and (
        "书" in value or "教材" in value
    ):
        concepts.add("buy")
    return concepts


def same_intent(left_concepts, right_concepts):
    intents = [
        {"buy", "flow"},
        {"auth", "effect"},
        {"schedule", "recommend"},
        {"note", "rank"},
        {"note", "recommend"},
        {"budget", "recommend"},
    ]
    return any(intent <= left_concepts and intent <= right_concepts for intent in intents)


def similarity_score(query, candidate):
    left = normalize_question(query)
    right = normalize_question(candidate)
    if not left or not right:
        return 0
    if left == right:
        return 1
    shorter, longer = sorted((left, right), key=len)
    if len(shorter) >= 4 and shorter in longer:
        return 0.9 * (len(shorter) / len(longer)) + 0.08
    left_grams = question_grams(left)
    right_grams = question_grams(right)
    overlap = len(left_grams & right_grams)
    coverage = overlap / max(1, min(len(left_grams), len(right_grams)))
    jaccard = overlap / max(1, len(left_grams | right_grams))
    sequence = difflib.SequenceMatcher(None, left, right).ratio()
    return max(sequence * 0.55 + coverage * 0.35 + jaccard * 0.1, jaccard)


def is_similar_question(query, candidate):
    left = normalize_question(query)
    right = normalize_question(candidate)
    if min(len(left), len(right)) < 4:
        return False
    left_concepts = question_concepts(left)
    right_concepts = question_concepts(right)
    concept_overlap = left_concepts & right_concepts
    score = similarity_score(left, right)
    if same_intent(left_concepts, right_concepts):
        return True
    if len(concept_overlap) >= 2 and score >= 0.55:
        return True
    if concept_overlap and concept_overlap == left_concepts and len(left_concepts) <= 2 and score >= 0.65:
        return True
    threshold = 0.88 if max(len(left), len(right)) <= 18 else 0.84
    return score >= threshold
