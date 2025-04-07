import { useEffect, useRef, useState } from 'react'
import Settings from './components/Settings'
import { AnimatePresence, motion } from 'framer-motion'
type ActiveMode = 'focus' | 'shortRest' | 'longRest' | 'settings'
type PomodoroActions = {
  focus: 'pause' | 'running'
  shortRest: 'pause' | 'running'
  longRest: 'pause' | 'running'
}
export type NotificationsActions = 'focus-end' | 'short-rest-end' | 'long-rest-end'

function App(): JSX.Element {
  const ipcHandle = (value: NotificationsActions): void => window.electron.ipcRenderer.send(value)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  // const [confirmUpdate, setConfirmUpdate] = useState(false)
  // const [newVersion, setNewVersion] = useState<null | string>(null)

  useEffect(() => {
    const listener = () => {
      setUpdateAvailable(true)
    }
  
    window.api.on('update-downloaded', listener)
  
    return () => {
      window.api.removeListener('update-downloaded', listener)
    }
  }, [])
  

  const [activeMode, setActiveMode] = useState<ActiveMode>('focus')
  const [pomodoroInicialTime, setPomodoroInitialTime] = useState({
    focus: '20:00',
    shortRest: '05:00',
    longRest: '15:00'
  })
  const [pomodoroTime, setPomodoroTime] = useState({
    focus: pomodoroInicialTime.focus,
    shortRest: pomodoroInicialTime.shortRest,
    longRest: pomodoroInicialTime.longRest
  })
  const [pomodoroActions, setPomodoroActions] = useState<PomodoroActions>({
    focus: 'pause',
    longRest: 'pause',
    shortRest: 'pause'
  })

  useEffect(() => {
    setPomodoroTime({
      focus: pomodoroInicialTime.focus,
      shortRest: pomodoroInicialTime.shortRest,
      longRest: pomodoroInicialTime.longRest
    })
  }, [pomodoroInicialTime])
  const [cicles, setCicles] = useState(0)

  const interval = useRef<NodeJS.Timeout | null>(null)
  function handleTime(v: string, pomoTime: keyof typeof pomodoroTime): string {
    const [minutes, seconds] = v.split(':').map(Number)

    if (v === '00:00') {
      clearInterval(interval.current as NodeJS.Timeout)
      if (pomoTime === 'focus') {
        setActiveMode('shortRest')
        ipcHandle('focus-end')
        return pomodoroInicialTime.focus
      } else if (pomoTime === 'shortRest') {
        setCicles((v) => v + 1)
        if (cicles > 0 && cicles % 4 === 0) {
          setActiveMode('longRest')
        } else {
          setActiveMode('focus')
        }
        ipcHandle('short-rest-end')
        return pomodoroInicialTime.shortRest
      } else {
        setActiveMode('focus')
        ipcHandle('long-rest-end')
        return pomodoroInicialTime.longRest
      }
    }

    if (seconds === 0) {
      if (minutes === 0) {
        return '00:00'
      }
      // Subtrai 1 minuto, e ajusta os segundos para 59
      return `${String(minutes - 1).padStart(2, '0')}:59`
    }

    // Se os segundos são maiores que 0, subtraímos 1 segundo
    return `${String(minutes).padStart(2, '0')}:${String(seconds - 1).padStart(2, '0')}`
  }

  useEffect(() => {
    if (pomodoroActions.focus === 'pause') {
      clearInterval(interval.current as NodeJS.Timeout)
    } else {
      if (activeMode === 'focus') {
        interval.current = setInterval(() => {
          setPomodoroTime((v) => {
            return {
              ...v,
              focus: handleTime(v.focus, 'focus')
            }
          })
        }, 1000)
      } else if (activeMode === 'shortRest') {
        interval.current = setInterval(() => {
          setPomodoroTime((v) => {
            return {
              ...v,
              shortRest: handleTime(v.shortRest, 'shortRest')
            }
          })
        }, 1000)
      } else if (activeMode === 'longRest') {
        interval.current = setInterval(() => {
          setPomodoroTime((v) => {
            return {
              ...v,
              longRest: handleTime(v.longRest, 'longRest')
            }
          })
        }, 1000)
      } else {
        clearInterval(interval.current as NodeJS.Timeout)
        setPomodoroActions({ focus: 'pause', longRest: 'pause', shortRest: 'pause' })
      }
    }
  }, [pomodoroActions, activeMode])

  return (
    <>
      <main>
        <div className="max-w-[58%] mx-auto">
          <div className="flex items-center justify-center action-buttons p-[1rem] bg-zinc-600/30 rounded-[1rem] mt-[4rem] gap-[.5rem] mx-auto">
            <button data-active={activeMode === 'focus'} onClick={() => setActiveMode('focus')}>
              Pomodoro
            </button>
            <button
              data-active={activeMode === 'shortRest'}
              onClick={() => setActiveMode('shortRest')}
            >
              Descanso rápido
            </button>
            <button
              data-active={activeMode === 'longRest'}
              onClick={() => setActiveMode('longRest')}
            >
              Descanso longo
            </button>
            <button
              onClick={() => setActiveMode('settings')}
              data-active={activeMode === 'settings'}
            >
              Configurações
            </button>
          </div>
          {activeMode !== 'settings' && (
            <>
              <h1 className="text-zinc-100 text-[12rem] text-center mt-[4rem] font-semibold">
                {pomodoroTime[activeMode]}
              </h1>
              <button
                onClick={() =>
                  setPomodoroActions((v) => ({
                    ...v,
                    focus: v.focus === 'pause' ? 'running' : 'pause'
                  }))
                }
                className="bg-zinc-100 text-zinc-900 text-[2rem] p-[1rem] mx-auto rounded-[1rem] block mt-[2rem]"
              >
                {pomodoroActions.focus === 'pause' ? 'Iniciar' : 'Pausar'}
              </button>
            </>
          )}
          {activeMode === 'settings' && (
            <Settings initialTime={pomodoroInicialTime} setInitialTime={setPomodoroInitialTime} />
          )}
        </div>
      </main>
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            initial={{ scale: 0.7, bottom: '-8rem', opacity: 0 }}
            exit={{ scale: 0.7, bottom: '-8rem', opacity: 0 }}
            animate={{ scale: 1, bottom: '4rem', opacity: 1 }}
            className="fixed right-[4rem] bg-zinc-800 p-[1.4rem] rounded-[1rem] border border-zinc-600 w-[30rem]"
          >
            <p className="text-zinc-100 text-[1.3rem] max-w-[80%] leading-[1.3]">
              Uma nova versão está disponível para download, deseja atualiza agora?
            </p>
            <div className="flex items-center gap-[1rem]">
              <button onClick={()=> window.api.send("confirm-update")} className="bg-zinc-100 text-zinc-900 p-[.8rem] rounded-[1rem] text-[1.2rem] block mt-[1.2rem]">
                Atualizar agora
              </button>
              <button onClick={()=> setUpdateAvailable(false)} className="bg-zinc-700 text-zinc-100 p-[.8rem] rounded-[1rem] text-[1.2rem] block mt-[1.2rem]">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default App
