/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
var express = require('express');
var app = express();
const { NlpManager, ConversationContext } = require('node-nlp');

// Initialize port
const port = process.env.PORT || 3000

// Start the server.
app.listen(port, () => {
    console.log('Server running at port ' + port);
});

/** 
 * Get form post data
 */
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


/**
 * Slot filling
 */
app.get('/slot_filling', async function (req, res) {
    const manager = new NlpManager({ languages: ['en'] });
    const fromEntity = manager.addTrimEntity('fromCity');
    fromEntity.addBetweenCondition('en', 'from', 'to');
    fromEntity.addAfterLastCondition('en', 'from');
    const toEntity = manager.addTrimEntity('toCity');
    toEntity.addBetweenCondition('en', 'to', 'from', { skip: ['travel'] });
    toEntity.addAfterLastCondition('en', 'to');

    manager.slotManager.addSlot('travel', 'fromCity', true, { en: 'Where do you want to go?' });
    manager.slotManager.addSlot('travel', 'toCity', true, { en: 'From where you are traveling?' });
    manager.slotManager.addSlot('travel', 'date', true, { en: 'When do you want to travel?' });


    manager.addDocument('en', 'I want to travel from %fromCity% to %toCity% %date%', 'travel');
    await manager.train();
    const result = await manager.process('en', 'I want to travel to Madrid tomorrow', {});
    res.send(JSON.stringify(result, null, 2));
});

app.get('/context_demo', async function (req, res) {
    const manager = new NlpManager({ languages: ['en'] });
    const context = new ConversationContext();

    manager.addDocument('en', 'Hello my name is %name%', 'greeting.hello');
    manager.addDocument('en', 'I have to go', 'greeting.bye');
    manager.addAnswer('en', 'greeting.hello', 'Hey there! {{name}}');
    manager.addAnswer('en', 'greeting.bye', 'Till next time, {{name}}!');

    let model = manager.train();

    let ansserval = model.then(result => manager.process('en', 'Hello my name is John', context));
    ansserval.then(function (result) {
        res.send(JSON.stringify(result))
    });
    
    /*manager.train()
        .then(function (result) { 
            manager.process('en', 'Hello my name is John', context)
            console.log("Result 1 -- " + JSON.stringify(result))
        })
        .then( function (result) {
            console.log("Result 2 -- " + JSON.stringify(result))
            manager.process('en', 'I have to go', context)
            res.send(JSON.stringify(result))
        })
        .then(function(result) {
            // console.log(result.answer)
        });*/
});
/**
 * Context
 * 
 */
app.post('/context', async function (req, res) {
    const nlpManager = new NlpManager({ languages: ['en'] });
    const context = new ConversationContext();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    nlpManager.load("subex.nlp");
    let trainedModel = nlpManager.train();

    let post_data = req.body;
    var input_text = post_data.text;

    console.log("input_text -- " + input_text)

    let ansserval = trainedModel.then(result => nlpManager.process('en', input_text, context)); 
    var answer = "Processing";
    ansserval.then(function (result) {
        // console.log("result---> " + JSON.stringify(result));
        let service_resonse = {
            "statusCode": 200,
            "answer": result.answer,
            "intent": result.intent,
            "language": result.language,
            "language_code": result.locale
        };
        //answer = result.answer;
        // console.log("result.answer "+answer);
        res.send(service_resonse)
    });
});

/**
 * NLP Manager
 * Add intents with entities
 */
app.get('/nlp', async function (req, res) {
    const { NlpManager } = require('node-nlp');
    const manager = new NlpManager({ languages: ['en'] });
    manager.addNamedEntityText(
        'hero',
        'spiderman',
        ['en'],
        ['Spiderman', 'Spider-man'],
    );
    manager.addNamedEntityText(
        'hero',
        'iron man',
        ['en'],
        ['iron man', 'iron-man'],
    );
    manager.addNamedEntityText('hero', 'thor', ['en'], ['Thor']);
    manager.addNamedEntityText(
        'food',
        'burguer',
        ['en'],
        ['Burguer', 'Hamburguer'],
    );
    manager.addNamedEntityText('food', 'pizza', ['en'], ['pizza']);
    manager.addNamedEntityText('food', 'pasta', ['en'], ['Pasta', 'spaghetti']);

    //Adding Utterences to intents
    manager.addDocument('en', 'I saw %hero% eating %food%', 'sawhero');
    manager.addDocument(
        'en',
        'I have seen %hero%, he was eating %food%',
        'sawhero',
    );
    manager.addDocument('en', 'I want to eat %food%', 'wanteat');
    await manager.train();
    manager
        .process('I saw spederman eating pizza today in the city!')
        .then(result => res.send(result));
});


/**
 * Sentiment Analysis
 * Ref: https://github.com/axa-group/nlp.js/blob/master/docs/sentiment-analysis.md
 */
app.get('/sentiment', async function (req, res) {
    
    const { SentimentManager } = require('node-nlp');

    const sentiment = new SentimentManager();
    sentiment
        .process('en', 'I like cats')
        .then(result => {
            res.send(result)
        });

    /********* NOT WORKING ******* */
    // const { SentimentAnalyzer } = require('node-nlp');
    // const sentiment = new SentimentAnalyzer({ language: 'en' });
    // sentiment.getSentiment('I like cats')
    //     .then(result => {
    //         res.send(result)
    //     });


});

/**
 * Builtin Entity Extraction
 * Ref : https://github.com/axa-group/nlp.js/blob/master/docs/builtin-entity-extraction.md
 */
app.get('/bulitin_entity_extraction', async function (req, res) {
    const { NerManager } = require('node-nlp');

    const manager = new NerManager({ threshold: 0.8 });

    /**
     * Email Entity
     */
    // manager.findEntities(
    //     'My email is rajivgandhic@sensiple.com. Feel free to contact me.',
    //     'en',
    // ).then(entities => {
    //     res.send(entities)
    // });

    /**
     * IP Extraction
     */
    // manager.findEntities(
    //     'My ip is 192.168.12.68',
    //     'en',
    // ).then(entities => {
    //     res.send(entities)
    // });

    /**
     * Hashtag Extraction
     */
    // manager.findEntities(
    //     'Open source is great! #contact_hash test',
    //     'en',
    // ).then(entities => {
    //     res.send(entities)
    // });

    /**
     * Phone Number / Number Extraction
     */
    // manager.findEntities(
    //     'Call me at 9962653305',
    //     'en',
    // ).then(entities => {
    //     res.send(entities)
    // });

    /**
     * Ordinal Extraction
     */
    // manager.findEntities(
    //     'he is sitting in second row',
    //     'en',
    // ).then(entities => {
    //     res.send(entities)
    // });

    /**
     * Dimension Extraction
     */
    // manager.findEntities(
    //     'my native is 650km from chennai',
    //     'en',
    // ).then(entities => {
    //     res.send(entities)
    // });

    /**
     * Age / Duration Extraction
     */
    // manager.findEntities(
    //     'he is 40years old',
    //     'en',
    // ).then(entities => {
    //     res.send(entities)
    // });

    /**
     * Date Extraction
     */
    manager.findEntities(
        // 'today\'s date is Feb 14 2019 ',
        'I will be back on monday',
        'en',
    ).then(entities => {
        res.send(entities)
    });

});

/**
 * NER Manager - Named Entity Recognition manager
 * Ref: https://github.com/axa-group/nlp.js/blob/master/docs/ner-manager.md
 */
app.get('/ner_manager', async function (req, res) {
    const { NerManager } = require('node-nlp');

    const manager = new NerManager({ threshold: 0.8 });
    
    /*manager.addNamedEntityText('hero', 'spiderman', ['en'],['Spiderman', 'Spider-man']);
    manager.addNamedEntityText('hero', 'iron man', ['en'], ['iron man', 'iron-man']);
    manager.addNamedEntityText('hero', 'thor', ['en'], ['Thor']);
    manager.addNamedEntityText('food', 'burguer', ['en'], ['Burguer', 'Hamburguer']);
    manager.addNamedEntityText('food', 'pizza', ['en'], ['pizza']);
    manager.addNamedEntityText('place', 'myplace', ['en'], ['chennai', 'madurai']);
    manager.addNamedEntityText('food', 'pasta', ['en'], ['Pasta', 'spaghetti']);

    //Regex entities
    const entity = manager.addNamedEntity('email', 'regex');
    entity.addRegex('en', /\b(\w[-._\w]*\w@\w[-._\w]*\w\.\w{2,3})\b/gi);    

    manager.findEntities(
        'I saw spederman eating speghetti in madurai and his email address in admin@spiderman.com',
        'en',
    ).then(entities => {
        res.send(entities)
    })*/

    //Trimmed Entities - Example
    const fromEntity = manager.addNamedEntity('fromEntity', 'trim');
    fromEntity.addBetweenCondition('en', 'from', 'to');
    fromEntity.addAfterLastCondition('en', 'to');
    const toEntity = manager.addNamedEntity('toEntity', 'trim');
    toEntity.addBetweenCondition('en', 'to', 'from');
    toEntity.addAfterLastCondition('en', 'from');

    manager.findEntities(
        'I want to travel from Chennai to Madurai',
        'en',
    ).then(entities => {
        res.send(entities)
    });
});

/**
 * NLP Classifier
 * Classify the intents
 * Ref: https://github.com/axa-group/nlp.js/blob/master/docs/nlp-classifier.md
 */
app.get('/classifier', async function (req, res) {
    const { NlpClassifier } = require('node-nlp');

    const classifier = new NlpClassifier({ language: 'fr' });
    classifier.add('Bonjour', 'greet');
    classifier.add('bonne nuit', 'greet');
    classifier.add('Bonsoir', 'greet');
    classifier.add("J'ai perdu mes clés", 'keys');
    classifier.add('Je ne trouve pas mes clés', 'keys');
    classifier.add('Je ne me souviens pas où sont mes clés', 'keys');
    await classifier.train();

    //Get all classification results in descending order
    const classifications = classifier.getClassifications('bonjour');

    //Get only the best classification result --------NOT WORKING
    // const classifications = classifier.classify('bonjour');

    res.send(classifications)
});


/**
 * Similar Search
 * Ref : https://github.com/axa-group/nlp.js/blob/master/docs/similar-search.md
 */
app.get('/similar_search', async function (req, res) {
    const { SimilarSearch } = require('node-nlp');

    const similar = new SimilarSearch();
    const text1 =
        'Morbi interdum ultricies neque varius condimentum. Donec volutpat turpis interdum metus ultricies vulputate.';
    const text2 = 'interdumaultriciesbneque';
    const result = similar.getBestSubstring(text1, text2);
    res.send(result)
});

/**
 * Language Guesser
 * Ref : https://github.com/axa-group/nlp.js/blob/master/docs/language-guesser.md
 */
app.get('/language_guesser', async function (req, res) {
    const { Language } = require('node-nlp');

    const language = new Language();
    const guess = language.guess(
        //input string
        'salut',
        //White listed languages
        ['de', 'es', 'en', 'fr'],
        //number of result
        3,
    );
    // console.log(JSON.stringify(guess));
    res.send(guess[0])
});

/**
 * Console Bot
 */
app.get('/console-bot', async function (req, res) {
    const manager = new NlpManager({ languages: ['en'] });
    // Adds the utterances and intents for the NLP
    manager.addDocument('en', 'goodbye for now', 'greetings.bye');
    manager.addDocument('en', 'bye bye take care', 'greetings.bye');
    manager.addDocument('en', 'okay see you later', 'greetings.bye');
    manager.addDocument('en', 'bye for now', 'greetings.bye');
    manager.addDocument('en', 'i must go', 'greetings.bye');
    manager.addDocument('en', 'hello', 'greetings.hello');
    manager.addDocument('en', 'hi', 'greetings.hello');
    manager.addDocument('en', 'howdy', 'greetings.hello');

    // Train also the NLG
    manager.addAnswer('en', 'greetings.bye', 'Till next time');
    manager.addAnswer('en', 'greetings.bye', 'see you soon!');
    manager.addAnswer('en', 'greetings.hello', 'Hey there!');
    manager.addAnswer('en', 'greetings.hello', 'Greetings!');

    // Train and save the model.
    (async () => {
        await manager.train();
        manager.save();
        const response = await manager.process('en', 'hello');
        // console.log(response);
        res.send(response)
    })();
    // res.send("Hello world")
});