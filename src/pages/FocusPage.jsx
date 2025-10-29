import { useEffect, useMemo, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { db } from '../firebase.js';
import { getTodayKey } from '../utils/date.js';
import '../styles/Focus.css';

const DEFAULT_DURATION = 25 * 60;

function formatDeadline(deadline) {
  if (!deadline) {
    return '期限: 未設定';
  }

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return '期限: 未設定';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(date);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffMs = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const formattedDate = `${deadlineDate.getFullYear()}/${String(
    deadlineDate.getMonth() + 1,
  ).padStart(2, '0')}/${String(deadlineDate.getDate()).padStart(2, '0')}`;

  return `期限: ${formattedDate}まであと${diffDays}日`;
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function FocusPage() {
  const { user, userDoc, refreshUserDoc } = useAuth();
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION);
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_DURATION);
  const [timerMode, setTimerMode] = useState('25');
  const [customMinutes, setCustomMinutes] = useState('30');

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTimeRemaining((current) => {
        if (current <= 1) {
          clearInterval(intervalId);
          setIsRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  const todayKey = getTodayKey();

  const shutdownList = userDoc?.shutdownList ?? [];
  const dailyTasks = userDoc?.dailyTasks ?? [];
  const mainGoal = userDoc?.mainGoal ?? { text: '', deadline: '' };

  const todayTasks = useMemo(
    () => dailyTasks.filter((task) => task.date === todayKey),
    [dailyTasks, todayKey],
  );

  if (!userDoc) {
    return <LoadingScreen />;
  }

  const userDocRef = doc(db, 'users', user.uid);

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

  const handleSelectDuration = (seconds, mode) => {
    setTimerMode(mode);
    setSelectedDuration(seconds);
    setTimeRemaining(seconds);
    setIsRunning(false);
  };

  const handleApplyCustomDuration = () => {
    const minutes = Number(customMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }
    const seconds = Math.round(minutes * 60);
    setCustomMinutes(String(minutes));
    handleSelectDuration(seconds, 'custom');
  };

  const handleStart = () => {
    if (timeRemaining === 0) {
      setTimeRemaining(selectedDuration);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleEnd = () => {
    setIsRunning(false);
    setTimeRemaining(selectedDuration);
  };

  const shutdownEntries = shutdownList
    .filter((item) => item?.name)
    .map((item) => ({ id: item.id, name: item.name }));

  return (
    <div className="focus-page">
      <header className="focus-top-bar">
        <button type="button" className="exit-button" onClick={() => navigate('/')}>
          集中セッションを終了
        </button>
      </header>

      <main className="focus-main">
        <section className="focus-goal-card">
          <span className="goal-label">メインゴール</span>
          <h1 className="goal-text">
            {mainGoal.text ? mainGoal.text : 'メインゴールが設定されていません'}
          </h1>
          <p className="goal-deadline">{formatDeadline(mainGoal.deadline)}</p>
        </section>

        <section className="focus-sections">
          <div className="focus-panel">
            <div className="panel-header">
              <h2>今日やること</h2>
              <span className="panel-subtext">集中中に完了したらチェックしましょう。</span>
            </div>
            <div className="tasks-list">
              {todayTasks.length === 0 && (
                <p className="empty-state">今日のタスクはまだ登録されていません。</p>
              )}
              {todayTasks.map((task) => (
                <label key={task.id} className="task-item">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                  />
                  <span className={task.completed ? 'task-completed' : ''}>{task.text}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="focus-panel">
            <div className="panel-header">
              <h2>今避けるべきもの</h2>
              <span className="panel-subtext">シャットダウンリストを思い出しましょう。</span>
            </div>
            <div className="shutdown-list">
              {shutdownEntries.length === 0 ? (
                <p className="empty-state">シャットダウンリストはまだ登録されていません。</p>
              ) : (
                <ul>
                  {shutdownEntries.map((item) => (
                    <li key={item.id}>{item.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="focus-panel timer-panel">
            <div className="panel-header">
              <h2>タイマー</h2>
              <span className="panel-subtext">25分・50分・カスタムで集中時間を管理。</span>
            </div>
            <div className="timer-display">{formatTime(timeRemaining)}</div>
            <div className="timer-presets">
              <button
                type="button"
                className={timerMode === '25' ? 'active' : ''}
                onClick={() => handleSelectDuration(25 * 60, '25')}
              >
                25分
              </button>
              <button
                type="button"
                className={timerMode === '50' ? 'active' : ''}
                onClick={() => handleSelectDuration(50 * 60, '50')}
              >
                50分
              </button>
            </div>
            <div className="timer-custom">
              <label htmlFor="custom-minutes">カスタム（分）</label>
              <div className="custom-input-group">
                <input
                  id="custom-minutes"
                  type="number"
                  min="1"
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                />
                <button type="button" onClick={handleApplyCustomDuration}>
                  設定
                </button>
              </div>
            </div>
            <div className="timer-actions">
              <button type="button" onClick={handleStart} disabled={isRunning}>
                開始
              </button>
              <button type="button" onClick={handlePause} disabled={!isRunning}>
                一時停止
              </button>
              <button type="button" onClick={handleEnd}>
                終了
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default FocusPage;
