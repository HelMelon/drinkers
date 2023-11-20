const getTheme = () => {
  const whatTimeNow = new Date().getHours();

  if (whatTimeNow >= 16) {
    return 'night';
  } else if (whatTimeNow < 9) {
    return 'night';
  } else {
    return 'day';
  }
};

export default getTheme;
