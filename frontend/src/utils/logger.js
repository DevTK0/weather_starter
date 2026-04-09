function serialize(level, moduleName, eventName, extra) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    module: moduleName,
    event: eventName,
    ...extra,
  });
}

export function createLogger(moduleName) {
  return {
    info(eventName, extra = {}) {
      console.log(serialize('info', moduleName, eventName, extra));
    },
    warn(eventName, extra = {}) {
      console.warn(serialize('warn', moduleName, eventName, extra));
    },
    error(eventName, extra = {}) {
      console.error(serialize('error', moduleName, eventName, extra));
    },
  };
}
