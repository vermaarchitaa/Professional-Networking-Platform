import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
    school:{
        type: String,
        default: '',
    },
    degree: {
        type: String,
        default: '',
    },
    fieldOfStudy: {
        type: String,
        default: '',
    },
    startDate: {
        type: String,
        default: '',
    },
    endDate: {
        type: String,
        default: '',
    },
    current: {
        type: Boolean,
        default: false,
    },
    description: {
        type: String,
        default: '',
    },
    grade: {
        type: String,
        default: '',
    },
    activitiesAndSocieties: {
        type: String,
        default: '',
    },
    skills: {
        type: [{
            name: {
                type: String,
                default: '',
            },
        }],
        default: [],
    },
    media: {
        type: [{
            type: {
                type: String,
                default: 'link',
            },
            url: {
                type: String,
                default: '',
            },
            name: {
                type: String,
                default: '',
            },
            description: {
                type: String,
                default: '',
            },
        }],
        default: [],
    },
});

const skillAssociationSchema = new mongoose.Schema({
    kind: {
        type: String,
        default: 'education',
    },
    refId: {
        type: String,
        default: '',
    },
}, { _id: false });

const profileSkillSchema = new mongoose.Schema({
    name: {
        type: String,
        default: '',
    },
    category: {
        type: String,
        default: '',
    },
    associations: {
        type: [skillAssociationSchema],
        default: [],
    },
});

const workSchema = new mongoose.Schema({
    company: {
        type: String,
        default: '',
    },
    position: {
        type: String,
        default: '',
    },
    years: {
        type: String,
        default: '',
    },
    location: {
        type: String,
        default: '',
    },
    locationType: {
        type: String,
        default: '',
    },
    employmentType: {
        type: String,
        default: '',
    },
    jobSource: {
        type: String,
        default: '',
    },
    current: {
        type: Boolean,
        default: false,
    },
    startDate: {
        type: String,
        default: '',
    },
    endDate: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    },
    skills: {
        type: [{
            name: {
                type: String,
                default: '',
            },
        }],
        default: [],
    },
    media: {
        type: [{
            type: {
                type: String,
                default: 'link',
            },
            url: {
                type: String,
                default: '',
            },
            name: {
                type: String,
                default: '',
            },
            description: {
                type: String,
                default: '',
            },
        }],
        default: [],
    },
});

const languageSchema = new mongoose.Schema({
    language: {
        type: String,
        default: '',
    },
    proficiency: {
        type: String,
        default: '',
    },
});

const ProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    bio: {
        type: String,
        default: ''
    },
    currentPost: {
        type: String,
        default: '',
    },
    pastWork: {
        type: [workSchema],
        default: [],
    },
    education: {
        type: [educationSchema],
        default: [],
    },
    skills: {
        type: [profileSkillSchema],
        default: [],
    },
    languages: {
        type: [languageSchema],
        default: [],
    },
    location: {
        type: String,
        default: ""
    },
    intro: {
        additionalName: {
            type: String,
            default: ""
        },
        pronouns: {
            type: String,
            default: ""
        },
        industry: {
            type: String,
            default: ""
        },
        city: {
            type: String,
            default: ""
        },
        country: {
            type: String,
            default: ""
        },
        education: {
            type: String,
            default: ""
        },
        educationIndex: {
            type: Number,
            default: null
        }
    },
    contactInfo: {
        email: {
            type: String,
            default: ""
        },
        phone: {
            type: String,
            default: ""
        },
        phoneType: {
            type: String,
            default: ""
        },
        address: {
            type: String,
            default: ""
        },
        birthday: {
            type: String,
            default: ""
        },
        website: {
            type: String,
            default: ""
        },
        instantMessaging: {
            type: String,
            default: ""
        },
        emailVisibility: {
            type: String,
            default: "anyone"
        },
        phoneVisibility: {
            type: String,
            default: "anyone"
        }
    },
    openToWork: {
        enabled: {
            type: Boolean,
            default: false
        },
        visibility: {
            type: String,
            default: "recruiters"
        },
        location: {
            type: String,
            default: ""
        },
        workTypes: {
            type: String,
            default: ""
        }
    }
});

const Profile = mongoose.model('Profile', ProfileSchema);

export default Profile;