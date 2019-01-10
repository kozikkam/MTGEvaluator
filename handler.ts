import * as cheerio from 'cheerio';
import * as rp from 'request-promise';

const siteUrl: string = 'http://flamberg.com.pl/advanced_search_result.php?keywords=';
const validSets: Array<string> = ['Ixalan', 'Rivals of Ixalan', 'Dominaria', 'Core Set 2019', 'Guilds of Ravnica'];

async function getSiteHtml(cardName: string): Promise<Object> {
  const cardNameNoSpaces: string = cardName.replace(/\s/g, '+');
  const fullUrl = siteUrl+cardNameNoSpaces;

  const siteHTML = await rp(fullUrl);
  const $ = await cheerio.load(siteHTML);

  return $;
}

function getCheapestCardPrice(cards: Array<any>): number {
  let cheapest: number = cards[0].price;
  let err: boolean = false;

  for(let el of cards) {
    if(el.price < cheapest) {
      cheapest = el.price;
      if(el.available == 0) err = true;
      else err = false;
    }
  }

  if(err) console.log('WARNING: ' + cards[0].name + ' not available for purchase');

  return cheapest;
}

function getValidCards(cards: Array<any>): Array<any> {
  let results: Array<any> = [];

  for(let i in cards) {
    if(validSets.includes(cards[i].set)) {
      results.push(cards[i]);
    }
  }

  if(results.length == 0) {
    throw new Error('ERROR: ' + cards[0].name + ' no card from valid set in database');
  }

  return results;
}

function elementsToArray($: any, selector: any): Array<any> {
  const dest: Array<any> = [];

  $(selector).each(function(i, elem) {
    if(isNaN(parseFloat($(this).text()))) {
      dest.push($(this).text());
    }
    else {
      dest.push(parseFloat($(this).text()));
    }
  });

  return dest;
}

async function getSingleCardPrice(cardName: string): Promise<number> {
  const $ = await getSiteHtml(cardName);
  const cardNames: Array<string> = elementsToArray($, '#productListing > tbody > tr > td > a');
  const cardPrices: Array<number> = elementsToArray($, '#productListing > tbody > tr > td:nth-child(4)');
  const cardsAvailable: Array<number> = elementsToArray($, '#productListing > tbody > tr:nth-child(1) > td:nth-child(5)');
  const cards: any = {};

  for(let i=0; i<cardNames.length; i += 2) {
    cards[i/2] = {
      name: cardNames[i],
      set: cardNames[i+1],
      price: cardPrices[i/2],
      available: cardsAvailable[i/2]
    }
  }

  if(Object.keys(cards).length == 0) {
    throw new Error(cardName + ' not in the database');
  }

  const validCards: Array<any> = getValidCards(cards);
  const cheapestPrice: number = getCheapestCardPrice(validCards);

  return cheapestPrice;
}

function getSingleCardPriceWithDelay(cardName: string): Promise<number> {
  return new Promise<number>((res, rej) => {
    setTimeout(() => res(getSingleCardPrice(cardName)),

    Math.floor(Math.random() * 250) + 1);
  })
}

module.exports.getData = async function (event: any, context: any, callback: Function): Promise<void> {
  let totalCost: number = 0;
  let totalCards: number = 0;

  const { file } = JSON.parse(event.body);

  const cards: Array<string> = file.split('\n');

  let i: number = 0;

  for(let card of cards) {
    let cardDetails: Array<string> = card.split(/\s/);
    let amount: number = parseInt(cardDetails.shift());
    let cardName: string = '';

    for(let i=0; i<cardDetails.length; i++) {
      if(cardDetails[i].charAt(0) !== '(') {
        cardName += cardDetails.shift() + ' ';
        i--;
      }
      else {
        break;
      }
    }

    try {
      let price: number = await getSingleCardPriceWithDelay(cardName);
      
      totalCost += amount * price;
      totalCards += amount;
    } catch(err) {
      console.log(err);
    }
  }

  const response: Object = { totalCost, totalCards };

  callback(null, {
    'statusCode': 200,
    'headers': { 'my_header': 'my_value' },
    'body': JSON.stringify({
      message: response,
    }),
    "isBase64Encoded": false,
  });

  return;
}