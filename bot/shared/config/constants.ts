export const colors = {
  success: "#A8D694",
  error: "#DC9A9A",
  default: "#CCCCCC",
  warning: "#E1CD8C",
  pending: "#B9B9B9",
  spotify: "#1DB954",
} as const;

export const emojis = {
  embed: {
    success: "<:success:1452508521374683136>",
    warning: "<:warning:1452508207078441112>",
    error: "<:error:1452508504752521269>",
    info: "<:i_:1524460762825752616>",
    pending: "<a:pending:1516175900868083863>",
    thingy: "<:line:1524459229237481775>",
  },
  voicemaster: {
    information: "<:info:1519515929120342096>",
    unlock: "<:unlock:1519516179431948369>",
    activity: "<:iOSHalo:1519439732164132994>",
    reveal: "<:reveal:1520828029012545716>",
    lock: "<:lock:1519516195815166203>",
    increase: "<:limit:1519515967531520092>",
    ghost: "<:hide:1520828030535073943>",
    disconnect: "<:disconnect:1519516561755476048>",
    decrease: "<:limit:1519515967531520092>",
    claim: "<:claim:1519516878240874607>",
    bitrate: "<:bitrate:1519516121391173772>",
    limit: "<:limit:1519515967531520092>",
    rename: "<:rename:1519515904470290493>",
  },
  paginator: {
    previous: "<:paginator_previous:1452508511270469765>",
    next: "<:paginator_next:1452508510301585532>",
    navigate: "<:paginator_navigate:1452508509085237378>",
    cancel: "<:paginator_cancel:1452508507797590158>",
  },
} as const;
