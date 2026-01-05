import Header from './components/Header'

function App(): React.JSX.Element {
  console.log(window.electronAPI)

  return (
    <div className="h-full">
      <Header />
    </div>
  )
}

export default App
