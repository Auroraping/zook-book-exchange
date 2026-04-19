import { BookOpen, AlertTriangle, ArrowRight, DownloadCloud, Sparkles } from 'lucide-react';
import { MOCK_COURSES, MOCK_BOOKS } from '../mockData';
import { Link } from 'react-router-dom';

const Schedule = () => {
    return (
        <div className="flex gap-8">
            {/* 左侧：模拟的课表结构 */}
            <div className="w-[300px] shrink-0">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-[100px]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-extrabold text-gray-800 text-lg">我的本学期课表</h2>
                        <button className="text-zju-blue hover:bg-blue-50 p-2 rounded-full transition-colors" title="从教务网一键导入">
                            <DownloadCloud className="w-5 h-5"/>
                        </button>
                    </div>
                    
                    <div className="flex flex-col gap-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                        {MOCK_COURSES.map((course, idx) => (
                            <div key={course.id} className="relative pl-8">
                                <div className={`absolute left-[9px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${idx===0 ? 'bg-zju-blue' : 'bg-gray-300'}`}></div>
                                <h3 className={`font-bold text-sm ${idx===0 ? 'text-zju-blue' : 'text-gray-700'}`}>{course.name}</h3>
                                <p className="text-[10px] text-gray-400 mt-1">{course.term} / {course.type}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 leading-relaxed">
                        <Sparkles className="w-4 h-4 mb-1 text-zju-blue" />
                        系统已探测到您下一学期的 4 门必修课程，右侧已经自动为您生成了最低价的采购车匹配方案。
                    </div>
                </div>
            </div>

            {/* 右侧：课程对应的推荐教辅信息流 */}
            <div className="flex-1 flex flex-col gap-8">
                {MOCK_COURSES.map(course => {
                    const matchedBooks = MOCK_BOOKS.filter(b => b.courseId === course.id);
                    
                    return (
                        <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="bg-[#f8fafc] px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-extrabold text-lg text-gray-800 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-zju-blue"/> {course.name} <span className="font-normal text-sm text-gray-400">专用配套库</span>
                                </h2>
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-bold border border-gray-200">共 {matchedBooks.length} 款现货</span>
                            </div>
                            
                            <div className="p-6">
                                {matchedBooks.length > 0 ? (
                                    <div className="flex flex-col gap-6">
                                        {matchedBooks.map(book => (
                                            <div key={book.id} className="flex gap-6 border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                                                <img src={book.cover} className="w-20 h-28 object-cover rounded-lg shadow-sm border border-gray-100" />
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <h4 className="font-bold text-gray-800 text-base mb-1">{book.title}</h4>
                                                    <div className="text-xs text-gray-500 mb-2">学姐自评成色：{book.condition}</div>
                                                     <div className="flex gap-2">
                                                        <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold border border-red-100 flex items-center">
                                                            当前全网最低底价 ¥{book.price}
                                                        </span>
                                                        <span className="text-[10px] bg-blue-50 text-zju-blue px-2 py-0.5 rounded font-bold border border-blue-100 flex items-center">
                                                            AI 必要性评分: {book.aiScore}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col justify-center items-end min-w-[120px]">
                                                     <Link to={`/book/${book.id}`} className="bg-zju-blue text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-zju-hover transition-colors flex items-center gap-1 group">
                                                         火速抢下 <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                     </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <AlertTriangle className="w-10 h-10 text-orange-300 mb-2" />
                                        <p className="text-sm font-bold text-gray-600">全网暂无同学上架此课程用书</p>
                                        <button className="mt-4 text-xs font-bold text-zju-blue border border-zju-blue px-4 py-1.5 rounded-full hover:bg-zju-light">
                                            点击进行全校重金悬赏
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Schedule;
