import AppRouter from './routes/AppRouter';
import Chatbot from './components/common/Chatbot'; // Đường dẫn mới theo cây thư mục

function App() {
  return (
    <>
      <AppRouter />
      <Chatbot /> 
    </>
  );
}

export default App;