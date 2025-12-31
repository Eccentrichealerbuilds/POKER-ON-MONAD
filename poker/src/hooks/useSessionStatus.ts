import { useEffect, useState } from 'react'
import { useIsTogether } from 'react-together'

type CroquetConnectionType = 'connecting' | 'online' | 'fatal' | 'offline'

export const useSessionStatus = (): CroquetConnectionType => {
  const [connectionStatus, set_connectionStatus] = useState<CroquetConnectionType>('offline')
  const isTogether = useIsTogether()

  useEffect(() => {
    const checkConnectionStatus = () => {
      const spinnerOverlay = document.getElementById('croquet_spinnerOverlay')
      const fatalElement = document.querySelector('.croquet_fatal')

      if      (fatalElement)   set_connectionStatus('fatal') //prettier-ignore
      else if (spinnerOverlay) set_connectionStatus('connecting') //prettier-ignore
      else if (isTogether)     set_connectionStatus('online') //prettier-ignore
      else                     set_connectionStatus('offline') //prettier-ignore
    }

    //initial check
    checkConnectionStatus()

    //set up observer to watch for changes in the body
    const observer = new MutationObserver(checkConnectionStatus)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    })

    return () => observer.disconnect()
  }, [isTogether])

  return connectionStatus
}
