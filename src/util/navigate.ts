import { navigate } from "gatsby"

export type NavigateFnOptions = {
    replace?: boolean
}

export type NavigateFn = (path: string, option?: NavigateFnOptions) => void

export const useNavigate = (): NavigateFn => navigate
