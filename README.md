# monzo-oauth

[<img src="https://user-images.githubusercontent.com/8649362/90971126-a3dcae00-e504-11ea-86c3-ee28457a9beb.png" width="721px" alt="monzo-oauth">](https://github.com/leonardodino/monzo-oauth)

tiny web app for getting your personal [**`monzo`**](https://monzo.com/) [OAuth token](https://docs.monzo.com/#authentication).

## usage

```bash
npx monzo-oauth
```

1. generate an API client [here](https://developers.monzo.com/api), the **Redirect URI** must be set to the server address.
2. you will be provided with a **Client ID** and **Client Secret**, copy them to the form.
3. submit to continue to the (second) OAuth flow.
4. Monzo will, again, send you an email with a redirect link.
5. by clicking on the link the token will be displayed.

## security

- keep your tokens safe
- read the source code
- run this on a trusted environment

feel free to report any security issues or concerns.
<br><sup>the contact email can be found attached to my commits</sup>

## requirements

- [**`node`**](https://nodejs.org/) v8 or newer
- **`browser`** any web browser

## license

[`MIT`](./LICENSE)
