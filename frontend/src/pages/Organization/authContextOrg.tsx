import { useAuthContext } from "context";

export const { 
    apiGet, 
    apiPut, 
    apiPost, 
    user, 
    setFeedbackMessage 
} = useAuthContext();