import OpenAI from 'openai'
import Chat from './components/chat';

export default async function Home() {



  return (
    <div className="h-dvh px-5">
      <Chat />
    </div>
  )
}