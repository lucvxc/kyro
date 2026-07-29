export interface HealthSnapshot {
  ready: boolean;
  uptime: number;
  commands: number;
  events: number;
  components: number;
  plugins: number;
  activeHandlers: number;
  guilds: number;
  errors: number;
  lastSync?: number;
}
