import { create } from 'zustand'
import { Client, ClientInteraction, ClientAlert, Sale } from '@/types'
import { crmService } from '@/services/crmService'
import { clientService } from '@/services/clientService'
import { salesService } from '@/services/salesService'
import { supabase } from '@/lib/supabase/client'

interface CrmState {
  clients: Client[]
  leads: Client[]
  interactions: ClientInteraction[]
  alerts: ClientAlert[]
  currentClient: Client | null
  clientSales: Sale[]
  isLoading: boolean
  fetchClients: () => Promise<void>
  fetchInteractions: () => Promise<void>
  fetchAlerts: () => Promise<void>
  fetchClientDetails: (clientId: string) => Promise<void>
  addInteraction: (interaction: Partial<ClientInteraction>) => Promise<void>
  updateInteractionStatus: (id: string, status: string) => Promise<void>
  createAlert: (alert: Partial<ClientAlert>) => Promise<void>
  dismissAlert: (id: string) => Promise<void>
  setClientStatus: (
    clientId: string,
    status: 'client' | 'lead',
  ) => Promise<void>
}

const useCrmStore = create<CrmState>((set, get) => ({
  clients: [],
  leads: [],
  interactions: [],
  alerts: [],
  currentClient: null,
  clientSales: [],
  isLoading: false,

  fetchClients: async () => {
    set({ isLoading: true })
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const allClients = await crmService.getClients(user.id)
      set({
        clients: allClients.filter((c) => c.status === 'client'),
        leads: allClients.filter((c) => c.status === 'lead'),
      })
    } catch (error) {
      console.error('Error fetching clients', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchInteractions: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const interactions = await crmService.getInteractions(undefined, user.id)
      set({ interactions })
    } catch (error) {
      console.error('Error fetching interactions', error)
    }
  },

  fetchAlerts: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const alerts = await crmService.getAlerts(user.id)
      set({ alerts })
    } catch (error) {
      console.error('Error fetching alerts', error)
    }
  },

  fetchClientDetails: async (clientId: string) => {
    set({ isLoading: true })
    try {
      const [client, sales, interactions] = await Promise.all([
        crmService.getClient(clientId),
        salesService.getSales(), // We filter below, assuming salesService fetches for user
        crmService.getInteractions(clientId),
      ])

      const filteredSales = sales.filter((s) => s.clientId === clientId)

      set({
        currentClient: client,
        clientSales: filteredSales,
        interactions: interactions,
      }) // Only interactions for this client in view
    } catch (error) {
      console.error('Error fetching client details', error)
    } finally {
      set({ isLoading: false })
    }
  },

  addInteraction: async (interaction) => {
    const newInteraction = await crmService.createInteraction(interaction)
    set((state) => ({
      interactions: [newInteraction, ...state.interactions],
    }))
  },

  updateInteractionStatus: async (id, status) => {
    // Optimistic update
    set((state) => ({
      interactions: state.interactions.map((i) =>
        i.id === id ? { ...i, status } : i,
      ),
    }))

    try {
      await crmService.updateInteraction(id, { status })
    } catch (error) {
      console.error('Error updating status', error)
      // Revert on error would be ideal
      get().fetchInteractions()
    }
  },

  createAlert: async (alert) => {
    const newAlert = await crmService.createAlert(alert)
    set((state) => ({
      alerts: [...state.alerts, newAlert],
    }))
  },

  dismissAlert: async (id) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    }))
    try {
      await crmService.dismissAlert(id)
    } catch (error) {
      console.error('Error dismissing alert', error)
    }
  },

  setClientStatus: async (clientId, status) => {
    await clientService.updateClient(clientId, { status })
    await get().fetchClients() // Refresh lists
  },
}))

export default useCrmStore
