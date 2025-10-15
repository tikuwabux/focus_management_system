import '../styles/LoadingScreen.css';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>読み込み中...</p>
    </div>
  );
}

export default LoadingScreen;
