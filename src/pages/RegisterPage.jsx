import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import '../styles/AuthPages.css';

function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError('確認用パスワードが一致しません。');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const ref = doc(db, 'users', credential.user.uid);
      await setDoc(ref, {
        email,
        mainGoal: { text: '', deadline: '' },
        shutdownList: [],
        dailyTasks: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('登録に失敗しました。入力内容をご確認ください。');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>新規登録</h1>
        <p className="auth-description">数分でアカウントを作成し、集中力管理をスタートしましょう。</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm">パスワード（確認）</label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? '登録中…' : '登録する'}
          </button>
        </form>
        <div className="auth-link">
          すでにアカウントをお持ちの方は<Link to="/login">こちら</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
