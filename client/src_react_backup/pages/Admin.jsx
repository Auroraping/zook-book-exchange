import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter, Flag, Trash2, AlertTriangle } from 'lucide-react';
import { MOCK_BOOKS, MOCK_REPORTS } from '../mockData';

const Admin = () => {
  const [books, setBooks] = useState([]);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'reports'

  useEffect(() => {
    setBooks(MOCK_BOOKS);
    setReports(MOCK_REPORTS);
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setBooks(prev => prev.map(book => 
      book.id === id ? { ...book, status: newStatus } : book
    ));
    alert(`书籍 ${id} 状态已更新为: ${newStatus}`);
  };

  const handleReportAction = (reportId, action) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    alert(`举报 ${reportId} 已处理: ${action}`);
  };

  const filteredBooks = books.filter(book => book.status === filter);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员工作台</h1>
          <p className="text-gray-500">审核书籍与处理社区举报，维护校园交易安全。</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
          {['pending', 'approved', 'rejected'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-white shadow-sm text-zju-blue' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f === 'pending' ? `待审核 (${books.filter(b => b.status === 'pending').length})` : f === 'approved' ? '已通过' : '已拒绝'}
            </button>
          ))}
          <button 
            onClick={() => setFilter('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filter === 'reports' ? 'bg-red-500 text-white shadow-md' : 'text-red-500 hover:bg-red-50'}`}
          >
            <Flag className="w-4 h-4" /> 举报处理 ({reports.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {filter === 'reports' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-red-50 border-b border-red-100">
                  <th className="px-6 py-4 text-xs font-semibold text-red-700 uppercase">举报详情</th>
                  <th className="px-6 py-4 text-xs font-semibold text-red-700 uppercase">被举报书籍</th>
                  <th className="px-6 py-4 text-xs font-semibold text-red-700 uppercase">时间</th>
                  <th className="px-6 py-4 text-xs font-semibold text-red-700 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map(report => {
                  const reportedBook = books.find(b => b.id === report.bookId);
                  return (
                    <tr key={report.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-red-600 font-bold">
                          <AlertTriangle className="w-4 h-4" /> {report.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={reportedBook?.cover} className="w-8 h-10 object-cover rounded" />
                          <div className="text-sm font-medium text-gray-700">{reportedBook?.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">{report.timestamp}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleReportAction(report.id, 'ignore')} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all">忽略</button>
                          <button onClick={() => handleReportAction(report.id, 'delete')} className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 shadow-md transition-all">强制下架</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">书籍信息</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">发布者</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">价格</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBooks.length > 0 ? filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{book.title}</div>
                          <div className="text-xs text-gray-500">{book.author}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {book.seller}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-zju-blue">¥{book.price}</div>
                      <div className="text-xs text-gray-400 line-through">¥{book.originalPrice}</div>
                    </td>
                    <td className="px-6 py-4">
                      {book.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          <Clock className="w-3 h-3" /> 待审核
                        </span>
                      )}
                      {book.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          <CheckCircle className="w-3 h-3" /> 已通过
                        </span>
                      )}
                      {book.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                          <XCircle className="w-3 h-3" /> 已拒绝
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {book.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleStatusChange(book.id, 'approved')}
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                            title="通过"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(book.id, 'rejected')}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="拒绝"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleStatusChange(book.id, 'pending')}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          撤销操作
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                      暂无状态为 {filter} 的记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
