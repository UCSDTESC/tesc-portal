export const formatDate = (date: string) => {
    return date.replaceAll(":", "").replaceAll("-", "").split("+")[0];
};

export const getCurrentTime = () => {
    const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOString = new Date(Date.now() - tzoffset).toISOString().slice(0, -1);
    // convert to YYYY-MM-DDTHH:MM
    const currTime = localISOString.substring(0, ((localISOString.indexOf("T") | 0) + 6) | 0);
    return currTime;
}

export const getFormDataDefault = () =>{
    const currTime = getCurrentTime();
    return {
        title: "",
        password: "",
        start_date: currTime,
        end_date: currTime,
        location: [0, 0],
        location_str: "",
        content: "",
        tags: [],
      }
}