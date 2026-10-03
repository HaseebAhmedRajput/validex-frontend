export const getDuration = (
  startTime: string,
  endTime: string
): number => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  return Math.floor(
    (end - start) / (1000 * 60)
  );
};