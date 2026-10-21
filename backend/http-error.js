/**
 * Форматирование ответа об ошибке: наружу уходит только безопасный текст,
 * детали (текст исключения, SQL) пишутся в лог сервера.
 */
export const toClientError = (error, code = 500, logger = console) => {
  if (code < 500) {
    // 4xx — это наши валидационные ошибки, их текст полезен клиенту и безопасен
    return { status: String(code), statusText: String(error?.message ?? 'Ошибка запроса') };
  }
  logger.error('[api]', error);
  return { status: '500', statusText: 'Внутренняя ошибка сервера' };
};
