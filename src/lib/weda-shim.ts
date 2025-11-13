export const ACTIONS_KEY = {} as Record<string, string>
export const ROUTER_KEY = {} as Record<string, string>
export const actionSdk = {} as Record<string, any>

function getStoredUser() {
  try {
    const val = localStorage.getItem("userInfo")
    return val ? JSON.parse(val) : null
  } catch {}
  return null
}

function setStoredUser(user: any) {
  try {
    if (user) {
      localStorage.setItem("userInfo", JSON.stringify(user))
    } else {
      localStorage.removeItem("userInfo")
    }
  } catch {}
}

export function createWebApp() {
  const listeners = new Set<(u: any) => void>()
  const auth = {
    currentUser: getStoredUser(),
    onAuthStateChanged(cb: (u: any) => void) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    signOut() {
      this.currentUser = null
      setStoredUser(null)
      listeners.forEach((fn) => fn(this.currentUser))
    },
  }

  const cloud = {
    async callFunction({ name, data }: { name: string; data?: any }) {
      if (name === "login-function") {
        const base = data?.userInfo || {}
        const user = {
          type: "wechat",
          userId: base.openId || "local-openid",
          name: base.nickName || "微信用户",
          nickName: base.nickName || "微信用户",
          avatarUrl: base.avatarUrl || "",
        }
        auth.currentUser = user
        setStoredUser(user)
        listeners.forEach((fn) => fn(auth.currentUser))
        return {
          result: {
            success: true,
            data: {
              openid: user.userId,
              userInfo: user,
              isNewUser: false,
            },
          },
        }
      }
      return { result: { success: false, error: "not implemented" } }
    },
  }

  return {
    utils: {
      showLoading() {},
    },
    showLoading() {},
    __internal__: {
      $w: {
        auth,
        cloud,
      },
      activePage: null,
    },
  }
}

export const _WEDA_CLOUD_SDK = {
  initTcb() {},
  setConfig(_: any) {},
  createDataset(pageId: string, _?: any, __?: any) {
    const params = __pageParams[pageId] || {}
    return {
      state: {},
      params,
    }
  },
  EXTRA_API: {
    setParams(pageId: string, params: any, opts?: any) {
      __pageParams[pageId] = params || {}
      try {
        const app = (window as any).app
        const active = app?.__internal?.activePage
        if (active && active.id === pageId) {
          active.dataset = active.dataset || { state: {}, params: {} }
          active.dataset.params = { ...active.dataset.params, ...(params || {}) }
        }
      } catch {}
    },
  },
}

const __pageParams: Record<string, any> = {}