import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

/**
 * 大数模幂运算函数 (BigInt Modular Exponentiation)
 * 实现 (base ^ exp) % mod
 */
function modPow(base, exp, mod) {
  let res = BigInt(1);
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) res = (res * base) % mod;
    base = (base * base) % mod;
    exp = exp / 2n;
  }
  return res;
}

/**
 * 浙江大学统一身份认证 (ZJU CAS) 登录逻辑
 * 100% 还原 Celechron (Dart) 的加密逻辑：Raw RSA (No Padding)
 */
export async function authenticateZJU(username, password) {
  try {
    const jar = new CookieJar();
    const instance = wrapper(axios.create({
      baseURL: 'https://zjuam.zju.edu.cn/cas',
      timeout: 15000,
      jar,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      proxy: false
    }));

    // 1. 获取登录页抓取 execution
    const loginPage = await instance.get('/login');
    const executionMatch = loginPage.data.match(/name="execution" value="(.+?)"/);
    if (!executionMatch) throw new Error('无法获取 execution 参数');
    const execution = executionMatch[1];

    // 2. 获取 RSA 公钥组件
    const pubKeyResponse = await instance.get('/v2/getPubKey');
    const { modulus, exponent } = pubKeyResponse.data;

    // 3. 执行 Celechron 同款“裸” RSA 加密
    // a. 将密码转为 BigInt (十六进制表示)
    const pwdHex = Buffer.from(password, 'utf8').toString('hex');
    const pwdInt = BigInt('0x' + pwdHex);
    
    // b. 模数和指数
    const modInt = BigInt('0x' + modulus);
    const expInt = BigInt('0x' + exponent);
    
    // c. 模幂运算: (pwdInt ^ expInt) % modInt
    const encryptedInt = modPow(pwdInt, expInt, modInt);
    
    // d. 转换为 hex 并补齐长度 (1024位 RSA 对应 256位 hex)
    // Celechron 逻辑中如果 mod 是 256位，则结果也应补齐到 256位
    const encryptedPassword = encryptedInt.toString(16).padStart(modulus.length, '0');
    
    console.log(`[Debug] Raw Encrypted Password: ${encryptedPassword.substring(0, 10)}...`);

    // 4. 提交登录表单
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', encryptedPassword);
    formData.append('execution', execution);
    formData.append('_eventId', 'submit');
    formData.append('authcode', '');
    formData.append('rememberMe', 'true');

    const response = await instance.post('/login', formData.toString(), {
      maxRedirects: 0,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://zjuam.zju.edu.cn/cas/login'
      },
      validateStatus: (status) => status >= 200 && status < 500,
    });

    // 5. 判定结果
    const cookies = await jar.getCookies('https://zjuam.zju.edu.cn');
    const isSuccess = response.status === 302 || cookies.some(c => c.key === 'iPlanetDirectoryPro');

    if (isSuccess) {
      return { success: true, message: '登录成功' };
    } else {
      const errorMsgMatch = response.data.match(/<span id="errorMsg"(.+?)>(.+?)<\/span>/);
      const errorMsg = errorMsgMatch ? errorMsgMatch[2].trim() : '学号或密码不匹配 (RAW_RSA_FAIL)';
      return { success: false, message: errorMsg };
    }
  } catch (error) {
    console.error('Final Auth Error:', error.message);
    return { success: false, message: '认证服务异常，请检查网络或代理' };
  }
}
