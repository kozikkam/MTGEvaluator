# MTGEvaluator
Serverless + typescript example of web scraping

First create `deck.txt` with copied deck (format from mtgggoldfish):

```
4 Arclight Phoenix (GRN) 91
4 Crackling Drake (GRN) 163
.
.
.
```

Then, fill out appriopriate variables in serverless.yml.

Finally, deploy serverless package `serverless deploy`. Afterwards, you can use `node requester.js` to request scraping from lambda.
