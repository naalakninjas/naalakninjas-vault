import { createClient } from '@supabase/supabase-js'

// Environment variables for Vite (must be prefixed with VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database service functions
export const dbService = {
  // Members
  async getMembers() {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('id')
    
    if (error) throw error
    return data
  },

  // Contributions
  async getContributions(memberId = null, month = null, year = null) {
    try {
      let query = supabase
        .from('contributions')
        .select(`
          *,
          members(name, color)
        `)
        .order('created_at', { ascending: false })

      if (memberId) query = query.eq('member_id', memberId)
      if (month) query = query.eq('month', month)
      if (year) query = query.eq('year', year)

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.warn('Supabase connection failed, using fallback data:', error.message)
      return [] // Return empty array if Supabase is unavailable
    }
  },

  async addContribution(contribution) {
    const { data, error } = await supabase
      .from('contributions')
      .insert([contribution])
      .select()

    if (error) throw error

    return data[0]
  },

  async updateContribution(id, updates) {
    const { data, error } = await supabase
      .from('contributions')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0]
  },

  async deleteContribution(id) {
    const { error } = await supabase
      .from('contributions')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Missions
  async getMissions(status = null) {
    let query = supabase
      .from('v_mission_summary')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async createMission(mission) {
    const { data, error } = await supabase
      .from('missions')
      .insert([mission])
      .select()

    if (error) throw error
    return data[0]
  },

  async updateMission(id, updates) {
    const { data, error } = await supabase
      .from('missions')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0]
  },

  // Votes
  async getVotesForMission(missionId) {
    const { data, error } = await supabase
      .from('votes')
      .select(`
        *,
        members(name, color)
      `)
      .eq('mission_id', missionId)

    if (error) throw error
    return data
  },

  async addVote(vote) {
    const { data, error } = await supabase
      .from('votes')
      .upsert([vote], { onConflict: 'mission_id,member_id' })
      .select()

    if (error) throw error
    return data[0]
  },

  // Repayments
  async getRepayments(missionId = null) {
    let query = supabase
      .from('repayments')
      .select(`
        *,
        missions(amount, member_id, members(name, color))
      `)
      .order('created_at', { ascending: false })

    if (missionId) query = query.eq('mission_id', missionId)

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async addRepayment(repayment) {
    const { data, error } = await supabase
      .from('repayments')
      .insert([repayment])
      .select()

    if (error) throw error
    return data[0]
  },

  // Activity
  async getActivity(limit = 20) {
    const { data, error } = await supabase
      .from('activity')
      .select(`
        *,
        members(name, color)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  // Settings
  /**
   * Returns the raw `{ key, value }` rows. Callers read them with
   * `readSetting`/`Array.prototype.find`, so the array shape is the contract.
   */
  async getSettings() {
    const { data, error } = await supabase
      .from('vault_settings')
      .select('*')

    if (error) throw error
    return data ?? []
  },

  async updateSetting(key, value) {
    const { data, error } = await supabase
      .from('vault_settings')
      .upsert([{ key, value }], { onConflict: 'key' })
      .select()

    if (error) throw error
    return data[0]
  },

  // Vault Balance Functions
  /**
   * Sums a numeric column client-side. Used as the fallback path when the
   * SQL helper functions have not been deployed to the project yet.
   *
   * `filter` is either { column, value } for an equality match or
   * { column, values } to match any of several values.
   */
  async _sumColumn(table, column, filter) {
    let query = supabase.from(table).select(column)

    if (filter?.values) query = query.in(filter.column, filter.values)
    else if (filter) query = query.eq(filter.column, filter.value)

    const { data, error } = await query
    if (error) throw error

    return (data || []).reduce((total, row) => total + (parseFloat(row[column]) || 0), 0)
  },

  /**
   * Cash held by the vault: contributions, less everything ever disbursed,
   * plus everything paid back.
   *
   * Prefers the get_vault_balance() SQL function. If that function is missing
   * (a fresh project where db/schema.sql has not been run), this computes the
   * same figure from the base tables rather than failing the caller — so the
   * arithmetic here must stay in step with the SQL version.
   *
   * 'repaid' missions count as disbursed alongside 'approved' ones: that is
   * what makes a repayment net out instead of being counted twice.
   */
  async getVaultBalance() {
    const { data, error } = await supabase.rpc('get_vault_balance')

    if (!error) return parseFloat(data) || 0

    console.warn('get_vault_balance() unavailable, computing client-side:', error.message)

    const [contributed, disbursed, repaid] = await Promise.all([
      this._sumColumn('contributions', 'amount'),
      this._sumColumn('missions', 'amount', {
        column: 'status',
        values: ['approved', 'repaid']
      }),
      this._sumColumn('repayments', 'amount')
    ])

    return contributed - disbursed + repaid
  },

  /**
   * Balance spendable right now: vault balance less the minimum reserve.
   * Mirrors get_available_balance(), including its floor at zero.
   */
  async getAvailableBalance() {
    const { data, error } = await supabase.rpc('get_available_balance')

    if (!error) return parseFloat(data) || 0

    console.warn('get_available_balance() unavailable, computing client-side:', error.message)

    const [vaultBalance, settings] = await Promise.all([
      this.getVaultBalance(),
      this.getSettings().catch(() => [])
    ])

    const configured = parseFloat(
      settings?.find((s) => s.key === 'minimum_balance')?.value
    )
    const minimumBalance = Number.isFinite(configured) ? configured : 50000

    return Math.max(0, vaultBalance - minimumBalance)
  },

  // Get member contribution totals (all time)
  async getMemberTotals() {
    try {
      const contributions = await this.getContributions()
      const memberTotals = {}
      
      // Calculate totals per member
      contributions.forEach(c => {
        if (!memberTotals[c.member_id]) {
          memberTotals[c.member_id] = {
            member_id: c.member_id,
            name: c.members?.name || 'Unknown',
            amount: 0,
            status: 'pending'
          }
        }
        memberTotals[c.member_id].amount += parseFloat(c.amount || 0)
        memberTotals[c.member_id].status = 'paid'
      })
      
      return Object.values(memberTotals)
    } catch (error) {
      console.warn('Error calculating member totals:', error.message)
      return []
    }
  },

  async getDashboardSummary() {
    return this.getDashboardSummaryFallback()
  },

  /**
   * Builds the dashboard payload from several independent sources.
   *
   * Uses allSettled rather than all: a single unavailable source should
   * degrade that one figure, not blank out the whole dashboard. If every
   * source fails (no connectivity, bad credentials) the error is rethrown so
   * the UI can show its error state instead of a misleading empty vault.
   */
  async getDashboardSummaryFallback() {
    const sources = [
      ['vaultBalance', () => this.getVaultBalance(), 0],
      ['availableBalance', () => this.getAvailableBalance(), 0],
      ['contributions', () => this.getContributions(), []],
      ['missions', () => this.getMissions(), []],
      ['repayments', () => this.getRepayments(), []],
      ['memberTotals', () => this.getMemberTotals(), []],
      ['recentActivity', () => this.getActivity(5), []]
    ]

    const settled = await Promise.allSettled(sources.map(([, run]) => run()))

    const resolved = {}
    let failures = 0

    settled.forEach((outcome, index) => {
      const [key, , fallback] = sources[index]

      if (outcome.status === 'fulfilled') {
        resolved[key] = outcome.value
      } else {
        failures += 1
        resolved[key] = fallback
        console.warn(`Dashboard source "${key}" failed:`, outcome.reason?.message)
      }
    })

    if (failures === sources.length) {
      throw new Error('Unable to reach the vault database')
    }

    const missions = resolved.missions || []

    return {
      vaultBalance: resolved.vaultBalance,
      availableBalance: resolved.availableBalance,
      totalContributions: (resolved.contributions || []).reduce(
        (sum, c) => sum + (parseFloat(c.amount) || 0),
        0
      ),
      activeMissions: missions.filter((m) => m.status === 'approved').length,
      pendingMissions: missions.filter((m) => m.status === 'pending').length,
      missions,
      repayments: resolved.repayments,
      monthlyStatus: resolved.memberTotals,
      recentActivity: resolved.recentActivity
    }
  }
}

// Default export for convenience
export default dbService