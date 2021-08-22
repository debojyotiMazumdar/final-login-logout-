const config={
    production:{
        SECRET:process.env.SECRET,
        DATABASE:process.env.MONGO_URI
    },
    default:{
        SECRET:'mysecretkey',
        DATABASE:"mongodb://localhost:27017/test"
    }
}

exports.get=function get(env){
    return config[env] || config.default
}

