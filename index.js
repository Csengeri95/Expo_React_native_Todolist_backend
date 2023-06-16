require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const bcrypt = require('bcrypt')
const port = 8000;


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ limit: '16mb' }))
app.use(cors())



app.post('/own_email/registration', async (req, res) => {

    const { username, email, password, image } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10)

    var user = {
        username,
        email,
        hashedPassword,
        image,
        tasks: [],
    }



    async function addUser(user) {

        try {
            await client.connect();
            const collection = client.db("Todolist").collection('users')
            console.log('Success connection to add')
            let result = await collection.insertOne(user)
            console.log(result)
        }
        catch (error) { throw error }
        finally { await client.close() }
    }


    async function read(query = {}, projections = {}) {

        try {
            await client.connect();
            const collection = client.db('Todolist').collection('users')
            let result = await collection.find(query, projections).toArray()
            console.log(result)
            return result
        }
        catch (error) { throw error }

        finally { await client.close() }
    }


    read()
        .then(result => {
            if (result.length > 0) {
                read({ username: user.username })
                    .then(result => {
                        if (result.length > 0) {
                            res.json({ Error: "A felhasználónév már foglalt!" })
                        }
                        else {
                            read({ email: user.email })
                                .then(result => {
                                    if (result.length > 0) {
                                        res.json({ Error: 'Az email cím már foglalt!' })
                                    }
                                    else {
                                        if (user.username !== "" && user.email !== "" && user.hashedPassword !== "") {
                                            addUser(user)
                                            res.json({ Message: 'A regisztráció sikeres!' })
                                        }
                                        else {
                                            res.json({ Error: "Adatok nincsenek kitöltve!" })
                                        }
                                    }
                                })
                        }
                    })
            }
            else {

                if (user.username !== "" && user.email !== "" && user.hashedPassword !== "") {
                    addUser(user);
                    res.json({ Message: 'A regisztráció sikeres!' });
                }
                else {
                    res.json({ Error: "Adatok nincsenek kitöltve!" });
                }
            }
        })

})


app.post('/imageValidation', (req, res) => {

    const { username, email } = req.body;

    var user = {
        username,
        email
    }

    async function read(query = {}, projections = {}) {

        try {
            await client.connect();
            const collection = client.db('Todolist').collection('users')
            let result = await collection.find(query, projections).toArray()
            console.log(result)
            return result
        }
        catch (error) { throw error }

        finally { await client.close() }
    }


    read()
        .then(result => {
            if (result.length > 0) {
                read({ username: user.username })
                    .then(result => {
                        if (result.length > 0) {
                            res.json({ Error: "A felhasználónév foglalt!" })
                        }
                        else {
                            read({ email: user.email })
                                .then(result => {
                                    if (result.length > 0) {
                                        res.json({ Error: "Az email cím foglalt!" })

                                    }
                                    else {
                                        if (user.username !== "" && user.email !== "") {
                                            res.json({ Message: 'Nincs ilyen felhasználó!' })
                                        }
                                        else {
                                            res.json({ Error: "Adatok nincsenek kitöltve!" })
                                        }
                                    }
                                })
                        }
                    })
            }
            else {

                if (user.username == "" && user.email == "") {
                    res.json({ Error: 'Adatok nincsenek kitöltve!' })
                }

                else {
                    res.json({ Message: "Nincs ilyen felhasználó!" })
                }
            }
        })

})





app.post('/own_email/login', (req, res) => {

    const { email, password } = req.body

    var user = {
        email,
        password
    }
    async function read(query = {}, projections = {}) {

        try {
            await client.connect();
            const collection = client.db('Todolist').collection('users')
            let result = await collection.find(query, projections).toArray()
            console.log(result)
            return result
        }
        catch (error) { throw error }

        finally { await client.close() }
    }


    read({ email: user.email })
        .then(result => {
            if (result.length > 0) {
                let findOne = result[0]
                bcrypt.compare(user.password, findOne.hashedPassword)
                    .then(match => {
                        if (match) {
                            res.json({
                                Message: 'A belépés sikeres!',
                                data: {
                                    id: findOne._id,
                                    username: findOne.username,
                                    image: findOne.image,
                                }
                            })
                        } else {
                            res.json({ Error: 'A beírt jelszó helytelen!' })
                        }
                    })
            }
            else {
                res.json({ Error: "A beírt email cím nem regisztrált!" })
            }
        })



});


app.post('/appleAuth/login', async (req, res) => {

    const { email } = req.body;

    var user = {
        email
    }

    async function read(query = {}, projections = {}) {

        try {
            await client.connect();
            const collection = client.db('Todolist').collection('users')
            let result = await collection.find(query, projections).toArray()
            console.log(result)
            return result
        }
        catch (error) { throw error }

        finally { await client.close() }
    }



    read({ email: user.email })
        .then(result => {
            if (result.length > 0) {
                let findOne = result[0]
                res.json({
                    Message: 'Sikeres belépés!',
                    data: {
                        id: findOne._id,
                        email: findOne.email,
                        familyName: findOne.fullName.familyName,
                        givenName: findOne.fullName.givenName,
                        image: findOne.image,
                    }
                })
            }
            else {
                res.json({ Error: "Az adott email címmel nem található regisztráció!" })
            }

        })
        .catch(error => {
            console.error(error);
            res.json({ Error: "Az azonosító token érvénytelen." });
        })



})



app.post('/addTask/:userId', (req, res) => {

    const { id, text, priority, date, notificationsId, completed } = req.body

    const { userId } = req.params
    async function read(query = {}, projections = {}) {

        try {
            await client.connect();
            const collection = client.db('Todolist').collection('users')
            let result = await collection.find(query, projections).toArray()
            console.log(result)
            return result
        }
        catch (error) { throw error }

        finally { await client.close() }
    }

    async function update(query = {}, newvalues) {

        try {
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
            await client.connect();
            const collection = client.db("Todolist").collection('users');
            let result = await collection.updateOne(query, newvalues)
        } catch (e) {
            throw e;
        }
        finally {
            await client.close();
        }


    };


    update({ _id: new ObjectId(userId) }, {
        $push: {
            tasks: {
                id: id,
                text: text,
                priority: priority,
                date: date,
                notificationsId: notificationsId,
                completed: completed
            }
        }
    })
        .then(() => res.json({ Message: 'A feltöltés sikeres!' }))
        .catch(error => {
            response.json({ Error: error })
        })
})

app.get('/tasks/:userId', (req, res) => {

    const { userId } = req.params

    async function read(query = {}, projections = {}) {

        try {
            await client.connect();
            const collection = client.db('Todolist').collection('users')
            let result = await collection.find(query, projections).toArray()
            console.log(result)
            return result
        }
        catch (error) { throw error }

        finally { await client.close() }
    }

    read({ _id: new ObjectId(userId) })
        .then(result => {
            if (result.length > 0) {
                let findOne = result[0];
                res.json({
                    Message: "Sikeres!",
                    data: findOne.tasks
                })
            }
            else {
                res.json({ Error: "Something went wrong!" })
            }
        })
        .catch(error => {
            res.json({ Error: error })
        })

})


app.get('/getProfile/:userId', (req, res) => {

    const { userId } = req.params

    async function read(query = {}, projections = {}) {

        try {
            await client.connect();
            const collection = client.db('Todolist').collection('users')
            let result = await collection.find(query, projections).toArray()
            console.log(result)
            return result
        }
        catch (error) { throw error }

        finally { await client.close() }
    }



    read({ _id: new ObjectId(userId) })
        .then(result => {
            if (result.length > 0) {
                let findOne = result[0];
                let response = {
                    Message: 'Sikeres!',
                    data: {
                        id: findOne._id,
                        email: findOne.email,
                        username: findOne.username,
                        image: findOne.image,
                    },
                };

                if (findOne.fullName && findOne.fullName.familyName) {
                    response.data.familyName = findOne.fullName.familyName;
                }

                if (findOne.fullName && findOne.fullName.givenName) {
                    response.data.givenName = findOne.fullName.givenName;
                }

                res.json(response);
            }
            else {
                res.json({ Error: "Something went wrong!" })
            }
        })
        .catch(error => {
            res.json({ Error: error })
        })


})

const queue = [];

app.post('/deleteTask/user/:userId/task/:taskId', (req, res) => {
    const { userId, taskId } = req.params;

    queue.push(async () => {

        try {
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

            await client.connect();
            const collection = client.db("Todolist").collection('users');
            const result = await collection.updateOne({ _id: new ObjectId(userId) }, { $pull: { tasks: { id: taskId } } });
            res.json({ Message: "A törlés sikeres!" });
        } catch (error) {
            res.json({ Error: error });
        } finally {
            await client.close();
        }
    });

    if (queue.length === 1) {
        processQueue();
    }
});

async function processQueue() {
    if (queue.length > 0) {
        const task = queue[0];
        await task();
        queue.shift();
        processQueue();
    }
}




app.post('/updateTask/user/:userId/task/:taskId', (req, res) => {

    const { newValue } = req.body;
    const { userId, taskId } = req.params;

    async function update(query = {}, newvalues) {

        try {
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
            await client.connect();
            const collection = client.db("Todolist").collection('users');
            let result = await collection.updateOne(query, newvalues)

            if (result.matchedCount === 1 && result.modifiedCount === 1) {
                res.json({ Message: 'Sikeres szerkesztés!' });
            } else {
                res.json({ Error: 'A szerkesztés nem sikerült!' });
            }
        } catch (e) {
            throw e;
        }
        finally {
            await client.close();
        }


    };

    update({ _id: new ObjectId(userId), 'tasks.id': taskId }, { $set: { 'tasks.$.text': newValue } })
})


app.post('/setNotificationsId/user/:userId/task/:taskId', (req, res) => {

    const { userId, taskId, } = req.params;
    const { notificationsId } = req.body

    async function update(query = {}, newvalues) {

        try {
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
            await client.connect();
            const collection = client.db("Todolist").collection('users');
            let result = await collection.updateOne(query, newvalues)
            if (result.matchedCount === 1 && result.modifiedCount === 1) {
                res.json({ Message: 'Sikeres szerkesztés!' });
            } else {
                res.json({ Error: 'A szerkesztés nem sikerült!' });
            }
            console.log(result);
        } catch (e) {
            throw e;
        }
        finally {
            await client.close();
        }


    };

    update({ _id: new ObjectId(userId), 'tasks.id': taskId }, { $set: { 'tasks.$.notificationsId': notificationsId, 'tasks.$.completed': true } })

})



app.post('/appleAuth/registration', (req, res) => {

    const { email, fullName } = req.body

    var user = {
        email,
        fullName,
        image: null,
        tasks: []
    }

    async function addUser(user) {

        try {
            await client.connect();
            const collection = client.db("Todolist").collection('users')
            console.log('Success connection to add')
            let result = await collection.insertOne(user)
            console.log(result)
        }
        catch (error) { throw error }

    }


    async function read(query = {}, projections = {}) {

        try {
            await client.connect();
            const collection = client.db('Todolist').collection('users')
            let result = await collection.find(query, projections).toArray()
            console.log(result)
            return result
        }
        catch (error) { throw error }

        finally { await client.close() }
    }



    read()
        .then(result => {
            if (result.length > 0) {
                read({ email: user.email })
                    .then(result => {
                        if (result.length > 0) {
                            res.json({ Error: 'A felhasználó már regisztrált!' })
                        }
                        else {
                            if (user.email !== "" && user.fullName !== "") {
                                addUser(user)
                                res.json({
                                    Message: 'A regisztráció sikeres!',


                                })
                            }
                            else {
                                res.json({ Error: "Adatok nincsenek kitöltve!" })
                            }
                        }
                    })
            }
            else {
                if (user.email !== "" && user.fullName !== "") {
                    addUser(user)
                    res.json({ Message: 'A regisztráció sikeres!' })
                }
                else {
                    res.json({ Error: "Adatok nincsenek kitöltve!" })
                }
            }
        })




})


app.post('/imageChange/:userId', (req, res) => {

    const { userId } = req.params;
    const { image } = req.body


    async function update(query = {}, newvalues) {

        try {
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
            await client.connect();
            const collection = client.db("Todolist").collection('users');
            let result = await collection.updateOne(query, newvalues)
            if (result.matchedCount === 1 && result.modifiedCount === 1) {
                res.json({ Message: 'Sikeres szerkesztés!' });
            } else {
                res.json({ Error: 'A szerkesztés nem sikerült!' });
            }
        } catch (e) {
            throw e;
        }
        finally {
            await client.close();
        }


    };

    update({ _id: new ObjectId(userId) }, { $set: { image: image } })
})



app.listen(port, () => {
    console.log(`A szerver a ${port}-on fut`)
})
