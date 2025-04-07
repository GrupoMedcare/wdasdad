import { ipcMain, Notification } from 'electron'
import icon from '../../resources/icon.png?asset'
export default function handleNotifications(): void {
  ipcMain.on('focus-end', () => {
    const focusEndNotification = new Notification({
      title: 'Sua sessão de foco encerrou',
      body: 'Hora descansar um pouco',
      icon
    })
    focusEndNotification.show()
  })
  ipcMain.on('short-rest-end', () => {
    const shortRestNotification = new Notification({
      title: 'Seu descanso curto encerrou',
      body: 'Hora de retornar ao foco da sua tarefa',
      icon
    })
    shortRestNotification.show()
  })
  ipcMain.on('long-rest-end', () => {
    const shortRestNotification = new Notification({
      title: 'Ciclo de pomodoro concluído',
      body: 'Parabéns por conseguir concluir seu ciclo de pomodoro.',
      icon
    })
    shortRestNotification.show()
  })
}
