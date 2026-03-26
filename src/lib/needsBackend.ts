/**
 * Heuristic: check if generated HTML likely needs a backend.
 * Returns true if the HTML contains forms, auth elements, data displays, etc.
 */
export function needsBackend(html: string): boolean {
  const lower = html.toLowerCase();
  const indicators = [
    "<form",
    "login",
    "signup",
    "sign-up",
    "sign up",
    "register",
    "регистрац",
    "авториз",
    "войти",
    "вход",
    'type="submit"',
    "type='submit'",
    "dashboard",
    "панель",
    "админ",
    "admin",
    "upload",
    "загруз",
    "file-input",
    'type="file"',
    "data-table",
    "crud",
    "каталог",
    "catalog",
    "cart",
    "корзин",
    "заказ",
    "order",
    "booking",
    "бронир",
    "reserv",
    "contact",
    "контакт",
    "feedback",
    "отзыв",
    "comment",
    "коммент",
    "subscribe",
    "подпис",
    "newsletter",
    "рассылк",
  ];

  return indicators.some((keyword) => lower.includes(keyword));
}
