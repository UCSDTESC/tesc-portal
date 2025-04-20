export const formatDate = (date: string) => {
    return date.replaceAll(":", "").replaceAll("-", "").split("+")[0];
};