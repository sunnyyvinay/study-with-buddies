const mongoose = require('mongoose')
const {ObjectId} = require('mongodb')
const User = require('../models/userModel')
const Groups = require('../models/groupModel')
const jwt = require('jsonwebtoken')
const { db } = require('../models/userModel')
const { useInRouterContext } = require('react-router-dom')

const createToken = (_id) => {
    return jwt.sign({_id}, process.env.SECRET, {expiresIn: '3d' })
}

// login user
const loginUser = async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.login(email, password)

        const token = createToken(user._id)
        res.status(200).json({email, token,  userId: user._id })
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

const signupUser = async (req, res) => {
    const { email, password, userName } = req.body;

    // Validate input data
    if (!email || !password || !userName) {
        return res.status(400).json({ error: "Please provide email, password, and username." });
    }

    try {
        // Call signup method, assuming it handles validation and hashing
        const user = await User.signup(email, password, userName);

        // Assuming createToken generates a JWT
        const token = createToken(user._id);

        // Respond with token and non-sensitive user data
        res.status(200).json({ email, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const getAllUsers = async (req, res) => {
    const users = await User.find({}).sort({createdAt: -1})
    res.status(200).json(users)
}


const getUsers = async(req, res) => {
    const { sports } = req.body
    try {
        const users = await User.findMatches(sports)
        if (!users){
            res.status(200).json("No matches")
        }
        else {
            res.status(200).json({users})
        }
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

const getUserById = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getUserGroups = async(req, res) => {
    const userId = req.params.id

    if (mongoose.Types.ObjectId.isValid(userId)){// && mongoose.Types.ObjectId.isValid(eventId)) {
        try {
            const user = await User.findById(userId);
        
            if (!user) {
              throw new Error('User not found');
            }
        
            const groupIds = user.myGroups; // Assuming myGroups is an array of event IDs
            console.log('groupIds', groupIds)
        
            // Assuming you have an Event model with group information
            const Group = require('../models/groupModel'); // Replace with the actual path to your group model
            const groups = await Group.find({ _id: { $in: groupIds } });
            console.log('groups', groups)
            res.status(200).json(groups)
        } catch (error) {
            console.log(error)
        }
    } else {
        res.status(400).json({ error: 'Invalid user or group ID' });
    }

    
}   

// add an event to a user's myEvents
const addGroup = async (req, res) => {
    const userId = req.params.id
    const groupId = req.body.myGroups; // Assuming you send the event ID in the request body

    if (mongoose.Types.ObjectId.isValid(userId)){// && mongoose.Types.ObjectId.isValid(eventId)) {
        db.collection('users')
            .updateOne({_id: new ObjectId(userId)}, {$push: {myGroups: groupId}, $inc: { groupsCreated: 1 }})
            .then(result =>{
                res.status(200).json(result)
            })
            .catch(err =>{
                res.status(500).json({error: 'Could not update the document'})
            })
    } else {
        res.status(400).json({ error: 'Invalid user or event ID' });
    }
};

// add an event to a user's myEvents
const removeGroup = async (req, res) => {
    const userId = req.params.id
    const groupId = req.body.myGroups; // Assuming you send the event ID in the request body

    if (mongoose.Types.ObjectId.isValid(userId)){// && mongoose.Types.ObjectId.isValid(eventId)) {
        db.collection('users')
            .updateOne({_id: new ObjectId(userId)}, {$pull: {myGroups: groupId}, $inc: { groupsCreated: -1 }})
            .then(result =>{
                res.status(200).json(result)
            })
            .catch(err =>{
                res.status(500).json({error: 'Could not update the document'})
            })
    } else {
        res.status(400).json({ error: 'Invalid user or event ID' });
    }
};


// add an event to a user's myEvents
const updateProfile = async (req, res) => {
    const userId = req.params.id
    const updates = req.body; // Assuming you send the event ID in the request body

    if (mongoose.Types.ObjectId.isValid(userId)){// && mongoose.Types.ObjectId.isValid(eventId)) {
        db.collection('users')
            .updateOne({_id: new ObjectId(userId)}, {$set: updates})
            .then(result =>{
                res.status(200).json(result)
            })
            .catch(err =>{
                res.status(500).json({error: 'Could not update the document'})
            })
    } else {
        res.status(400).json({ error: 'Invalid user or event ID' });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such User'})
    }

    const event = await User.findOneAndUpdate({_id: id}, {
        ...req.body
    })
    if (!event) {
        return res.status(404).json({error: 'No such User'})
    }
    res.status(200).json(event)
}


module.exports = { 
    loginUser, 
    signupUser, 
    getUsers,
    getUserGroups,
    updateUser,
    addGroup,
    getAllUsers,
    getUserById,
    updateProfile,
    removeGroup
}