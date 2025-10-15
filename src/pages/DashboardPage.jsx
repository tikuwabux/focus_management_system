import { useEffect, useMemo, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext.jsx';
import { db } from '../firebase.js';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { formatDateDisplay, getTodayKey } from '../utils/date.js';
import '../styles/Dashboard.css';

const shutdownCategories = ['SNS', '動画', 'ニュース', 'その他'];

function DashboardPage() {
  const { user, userDoc, refreshUserDoc, logout } = useAuth();
  const [mainGoalText, setMainGoalText] = useState('');
  const [mainGoalDeadline, setMainGoalDeadline] = useState('');
  const [shutdownName, setShutdownName] = useState('');
  const [shutdownCategory, setShutdownCategory] = useState(shutdownCategories[0]);
  const [editingShutdownId, setEditingShutdownId] = useState(null);
  const [taskText, setTaskText] = useState('');
  const todayKey = getTodayKey();

  useEffect(() => {
    if (userDoc) {
      setMainGoalText(userDoc.mainGoal?.text ?? '');
      setMainGoalDeadline(userDoc.mainGoal?.deadline ?? '');
    }
  }, [userDoc]);

  if (!userDoc) {
    return <LoadingScreen />;
  }

  const shutdownList = userDoc.shutdownList ?? [];
  const dailyTasks = userDoc.dailyTasks ?? [];

  const todayTasks = useMemo(
    () => dailyTasks.filter((task) => task.date === todayKey),
    [dailyTasks, todayKey],
  );

  const todayCompleted = todayTasks.filter((task) => task.completed).length;
  const todayRemaining = todayTasks.length - todayCompleted;
  const stats = [
    { label: 'メインゴール', value: mainGoalText ? 1 : 0, accent: 'stat-primary' },
    { label: 'シャットダウン中', value: shutdownList.length, accent: 'stat-warning' },
    { label: '今日完了', value: todayCompleted, accent: 'stat-success' },
    { label: '今日残り', value: todayRemaining, accent: 'stat-danger' },
  ];

  const userDocRef = doc(db, 'users', user.uid);

  const handleMainGoalSubmit = async (event) => {
    event.preventDefault();
    await updateDoc(userDocRef, {
      mainGoal: { text: mainGoalText.trim(), deadline: mainGoalDeadline },
      updatedAt: serverTimestamp(),
    });
    await refreshUserDoc();
  };

  const handleClearMainGoal = async () => {
    setMainGoalText('');
    setMainGoalDeadline('');
    await updateDoc(userDocRef, {
      mainGoal: { text: '', deadline: '' },
      updatedAt: serverTimestamp(),
    });
    await refreshUserDoc();
  };

  const resetShutdownForm = () => {
    setShutdownName('');
    setShutdownCategory(shutdownCategories[0]);
    setEditingShutdownId(null);
  };

  const handleShutdownSubmit = async (event) => {
    event.preventDefault();
    if (!shutdownName.trim()) return;

    let updatedList = shutdownList;

    if (editingShutdownId) {
      updatedList = shutdownList.map((item) =>
        item.id === editingShutdownId
          ? { ...item, name: shutdownName.trim(), category: shutdownCategory }
          : item,
      );
    } else {
      const newItem = {
        id: `shutdown-${Date.now()}`,
        name: shutdownName.trim(),
        category: shutdownCategory,
        createdAt: new Date().toISOString(),
      };
      updatedList = [...shutdownList, newItem];
    }

    await updateDoc(userDocRef, {
      shutdownList: updatedList,
      updatedAt: serverTimestamp(),
    });
    await refreshUserDoc();
    resetShutdownForm();
  };

  const handleShutdownEdit = (item) => {
    setShutdownName(item.name);
    setShutdownCategory(item.category);
    setEditingShutdownId(item.id);
  };

  const handleShutdownDelete = async (id) => {
    const updatedList = shutdownList.filter((item) => item.id !== id);
    await updateDoc(userDocRef, {
      shutdownList: updatedList,
      updatedAt: serverTimestamp(),
    });
    await refreshUserDoc();
    if (editingShutdownId === id) {
      resetShutdownForm();
    }
  };

  const handleAddTask = async (event) => {
    event.preventDefault();
    if (!taskText.trim()) return;
    if (todayTasks.length >= 3) return;

    const newTask = {
      id: `task-${Date.now()}`,
      text: taskText.trim(),
      completed: false,
      date: todayKey,
      createdAt: new Date().toISOString(),
    };

    await updateDoc(userDocRef, {
      dailyTasks: [...dailyTasks, newTask],
      updatedAt: serverTimestamp(),
    });
    await refreshUserDoc();
    setTaskText('');
  };

  const handleToggleTask = async (taskId) => {
    const updatedTasks = dailyTasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    );
    await updateDoc(userDocRef, {
      dailyTasks: updatedTasks,
      updatedAt: serverTimestamp(),
    });
    await refreshUserDoc();
  };

  const handleDeleteTask = async (taskId) => {
    const updatedTasks = dailyTasks.filter((task) => task.id !== taskId);
    await updateDoc(userDocRef, {
      dailyTasks: updatedTasks,
      updatedAt: serverTimestamp(),
    });
    await refreshUserDoc();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="branding">
          <div className="logo-circle">F</div>
          <div>
            <h1>集中力管理システム</h1>
            <span className="tagline">Focus Management System</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="user-email">{user.email}</div>
          <button type="button" className="logout-button" onClick={logout}>
            ログアウト
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className={`stat-card ${stat.accent}`}>
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
        </section>

        <section className="main-goal-card">
          <div className="section-header">
            <h2>メインゴール</h2>
            <span className="section-subtitle">今もっとも集中したいことを設定しましょう。</span>
          </div>
          <form className="main-goal-form" onSubmit={handleMainGoalSubmit}>
            <div className="goal-inputs">
              <div className="field">
                <label htmlFor="goal-text">ゴール</label>
                <input
                  id="goal-text"
                  type="text"
                  placeholder="例：ポテパンに1点集中する"
                  value={mainGoalText}
                  onChange={(event) => setMainGoalText(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="goal-deadline">期限（任意）</label>
                <input
                  id="goal-deadline"
                  type="date"
                  value={mainGoalDeadline}
                  onChange={(event) => setMainGoalDeadline(event.target.value)}
                />
              </div>
            </div>
            <div className="goal-actions">
              <button type="submit" className="primary">
                保存する
              </button>
              <button type="button" className="ghost" onClick={handleClearMainGoal}>
                クリア
              </button>
            </div>
          </form>
          {mainGoalText && (
            <div className="main-goal-display">
              <h3>{mainGoalText}</h3>
              {mainGoalDeadline && (
                <p className="deadline">期限：{formatDateDisplay(mainGoalDeadline)}</p>
              )}
            </div>
          )}
        </section>

        <section className="panels-grid">
          <div className="panel">
            <div className="section-header">
              <h2>シャットダウンリスト</h2>
              <span className="section-subtitle">集中を妨げるものを記録しましょう。</span>
            </div>
            <form className="panel-form" onSubmit={handleShutdownSubmit}>
              <div className="field-group">
                <div className="field">
                  <label htmlFor="shutdown-name">名前</label>
                  <input
                    id="shutdown-name"
                    type="text"
                    value={shutdownName}
                    onChange={(event) => setShutdownName(event.target.value)}
                    placeholder="例：YouTube"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="shutdown-category">カテゴリ</label>
                  <select
                    id="shutdown-category"
                    value={shutdownCategory}
                    onChange={(event) => setShutdownCategory(event.target.value)}
                  >
                    {shutdownCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="goal-actions">
                <button type="submit" className="primary">
                  {editingShutdownId ? '更新する' : '追加する'}
                </button>
                {editingShutdownId && (
                  <button type="button" className="ghost" onClick={resetShutdownForm}>
                    キャンセル
                  </button>
                )}
              </div>
            </form>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>名前</th>
                    <th>カテゴリ</th>
                    <th>登録日</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {shutdownList.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-cell">
                        登録された項目はありません。
                      </td>
                    </tr>
                  )}
                  {shutdownList.map((item, index) => (
                    <tr key={item.id}>
                      <td>{String(index + 1).padStart(2, '0')}</td>
                      <td>{item.name}</td>
                      <td>
                        <span className={`badge badge-${item.category}`}>
                          {item.category}
                        </span>
                      </td>
                      <td>{formatDateDisplay(item.createdAt)}</td>
                      <td className="table-actions">
                        <button type="button" onClick={() => handleShutdownEdit(item)}>
                          編集
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleShutdownDelete(item.id)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="section-header">
              <h2>今日やること（最大3つ）</h2>
              <span className="section-subtitle">今日の行動を具体化し、確実に完了しましょう。</span>
            </div>
            <form className="panel-form" onSubmit={handleAddTask}>
              <div className="field">
                <label htmlFor="task-text">タスク</label>
                <input
                  id="task-text"
                  type="text"
                  value={taskText}
                  onChange={(event) => setTaskText(event.target.value)}
                  placeholder="例：シャットダウンリストを見直す"
                  disabled={todayTasks.length >= 3}
                />
              </div>
              <div className="goal-actions">
                <button type="submit" className="primary" disabled={todayTasks.length >= 3}>
                  追加する
                </button>
                {todayTasks.length >= 3 && <p className="helper-text">※ 登録できるのは最大3件です。</p>}
              </div>
            </form>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>タスク</th>
                    <th>状態</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTasks.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-cell">
                        今日のタスクはまだありません。
                      </td>
                    </tr>
                  )}
                  {todayTasks.map((task, index) => (
                    <tr key={task.id}>
                      <td>{String(index + 1).padStart(2, '0')}</td>
                      <td className={task.completed ? 'task-completed' : ''}>{task.text}</td>
                      <td>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task.id)}
                          />
                          <span>{task.completed ? '完了' : '未完了'}</span>
                        </label>
                      </td>
                      <td className="table-actions">
                        <button type="button" onClick={() => handleToggleTask(task.id)}>
                          {task.completed ? '戻す' : '完了'}
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <button type="button" className="focus-button">
          集中モードを開始
        </button>
      </footer>
    </div>
  );
}

export default DashboardPage;
