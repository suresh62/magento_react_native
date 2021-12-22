/**
 * Magento Settings for the app,
 * Follow instructions: https://github.com/alexakasanjeev/magento_react_native/wiki/Setup
 *
 * url                     : Base url of the magento website
 * home_cms_block_id       : Block id which conatin json data,
 *                           which will be shown in Home screen
 * store                   : store code // Stores > All Stores > Store View > Code
 * password_reset_template : Email template name in magento backend,
 *                           use for sending password reset e-mail
 * access_token            : Token to access magento API, without it
 *                           app won't work
 */
export const magentoOptions = {
  url: 'http://devm2.bsscommerce.com/magento241/', // make sure you have trail slash in the end
  home_cms_block_id: 1, // required int
  store: 'default',
  password_reset_template: 'email_reset', // This is required in order to reset password link to work
  authentication: {
    integration: {
      access_token: 'h138yoeu2rlx52rzg0bqh7xipuuq9foj',
    }
  }
};

/**
 * Magento 2 REST API doesn't return currency symbol,
 * so manually specify all currency symbol(that your store support)
 * along side their currency code.
 */
export const currencySymbols = Object.freeze({
  USD: '$',
  EUR: '€',
  AUD: 'A$',
  GBP: '£',
  CAD: 'CA$',
  CNY: 'CN¥',
  JPY: '¥',
  SEK: 'SEK',
  CHF: 'CHF',
  INR: '₹',
  KWD: 'د.ك',
  RON: 'RON',
});
