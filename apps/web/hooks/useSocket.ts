'use client'
import { useAuth } from "@clerk/nextjs"
import { useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3002'
let socket: Socket | null = null

interface SocketHandlers {
    onEnrichmentComplete: (data: { ideaId: string, enrichment: any }) => void
    onGoalsDue?: (data: { goals: any[] }) => void
}

export function useSocket(handlers: SocketHandlers) {
    const { userId } = useAuth()
    const handlersRef = useRef(handlers)
    handlersRef.current = handlers

    useEffect(() => {
        if (!userId) return

        if (!socket) {
            socket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                autoConnect: false,
            })
        }

        if (!socket.connected) {
            socket.connect()
        }

        const handleConnect = () => {
            console.log('[Socket] Connected, joining room for: ', userId)
            socket?.emit('join', userId)
        }

        const handleEnrichment = (data: { ideaId: string, enrichment: any }) => {
            console.log(`[Socket] Enrichment received for idea: ${data.ideaId}`)
            handlersRef.current.onEnrichmentComplete(data)
        }

        const handleGoalsDue = (data: { goals: any[] }) => {
            console.log(`[Socket] Goals due received: ${data.goals.length} goals`)
            handlersRef.current.onGoalsDue?.(data)
        }

        const handleReconnect = () => {
            console.log('[Socket] Reconnected, rejoining room')
            socket?.emit('join', userId)
        }

        if (socket.connected) {
            socket.emit('join', userId)
        }

        socket.onAny((event, ...args) => {
            console.log('[Socket ANY]', event, args)
        })

        socket.on('connect', handleConnect)
        socket.on('enrichment:complete', handleEnrichment)
        socket.on('goals:due', handleGoalsDue)
        socket.on('reconnect', handleReconnect)

        return () => {
            socket?.off('connect', handleConnect)
            socket?.off('enrichment:complete', handleEnrichment)
            socket?.off('goals:due', handleGoalsDue)
            socket?.off('reconnect', handleReconnect)
        }
    }, [userId])
}