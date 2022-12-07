const Koa = require("koa");
const Router = require("@koa/router");
const { isReady, PrivateKey, Field, Signature } = require("snarkyjs");

const { axios } = require('axios');

const PORT = process.env.PORT || 3000;

const app = new Koa();
const router = new Router();

const moralis_api_key = 'J5wHxshtaWb7C91qgDtoVKYiVswqlV0tVjHmde5hrupiQWCuUCBDDNVbxQkKPAmb';

export async function getEthBalance(ethWalletAddress: string) {
    // We need to wait for SnarkyJS to finish loading before we can do anything
    await isReady;
  
    // The private key of our account. When running locally the hardcoded key will
    // be used. In production the key will be loaded from a Vercel environment
    // variable.
    const privateKey = PrivateKey.fromBase58(
      process.env.PRIVATE_KEY ??
        "EKF65JKw9Q1XWLDZyZNGysBbYG21QbJf3a4xnEoZPZ28LKYGMw53"
    );

    const options = {
        method: 'GET',
        url: 'https://deep-index.moralis.io/api/v2/' + ethWalletAddress + '/balance',
        params: {chain: 'eth'},
        headers: {accept: 'application/json', 'X-API-Key': moralis_api_key}
      };
  
    // We get the users credit score. In this case it's 787 for user 1, and 536
    // for anybody else :)
    const response = await axios
                                .request(options)
                                .then(function (response: { data: {"balance": string}; }) {
                                    return response;
                                })
                                .catch(function (error: any) {
                                    console.error(error);
                                });
    let knownEthBalance = "";   
    if( response ) {
        knownEthBalance = response.data.balance;
    }
    console.log("knownEthBalance");
  
    // We compute the public key associated with our private key
    const publicKey = privateKey.toPublicKey();
    console.log("publicKey");
  
    // Define a Field with the value of the users id
    // const parsedEthWalletAddress = parseInt(ethWalletAddress, 16);
    console.log("before ethWalletAddress", ethWalletAddress);
    const id = Field(BigInt(ethWalletAddress));
    console.log("id");

    // Define a Field with the users credit score
    const ethBalance = Field(knownEthBalance);
    console.log("ethBalance");

    // Use our private key to sign an array of Fields containing the users id and
    // credit score
    const signature = Signature.create(privateKey, [id, ethBalance]);
  
    console.log("signature");
    return {
      data: { id: id, creditScore: ethBalance },
      signature: signature,
      publicKey: publicKey,
    };
  }

router.get("/address/:id", async (ctx) => {
  ctx.body = await getEthBalance(ctx.params.id);
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT);
