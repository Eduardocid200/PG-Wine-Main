const bcryptjs = require('bcryptjs')

const {
    User
} = require("../../db.js");

const { generarJWT } = require('../../helpers/generar-jwt');
const { googleVerify } = require('../../helpers/google-verify');
const { sendMail } = require('../../helpers/welcome-mail');



const login = async(req, res) => {

    const { email, password } = req.body;

    try {
      
        // Verificar si el email existe
        const usuario = await User.findOne({ where: { email: email } });
        if ( !usuario ) {
            return res.status(400).json({
                msg: 'Email no está registrado en Diosinio Wines'
            });
        }

        // SI el usuario está activo
        if ( usuario.status !== "active" ) {
            return res.status(400).json({
                msg: 'Usuario / Password no son correctos - estado: false'
            });
        }

        // Verificar la contraseña
        const validPassword = bcryptjs.compareSync( password, usuario.password );
        if ( !validPassword ) {
            return res.status(400).json({
                msg: 'Password no es correcto'
            });
        }

        // Generar el JWT
        const token = await generarJWT( usuario.idUser );

        res.json({
            usuario,
            token
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            msg: 'Hable con el administrador'
        });
    }   

}


const googleSignin = async(req, res) => {

    const { id_token } = req.body;
    
    try {
        const { firstName, lastName, email, profilePic } = await googleVerify( id_token );
        console.log( firstName, lastName, email);
    

       const usuario = await User.findOne({where: {email: email}})
        console.log(usuario)
                   
        try {
            if ( !usuario ) {
                // Tengo que crearlo
                const data = {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: ":p",
                    rol: "USER_ROLE",
                    google: true,
                    profilePic: profilePic
                };
                
                await sendMail(firstName, lastName, email);
                usuario = await User.create( data );
                await usuario.save();
                
            }
    
            // Si el usuario en DB
            if ( usuario.status !== 'active' ) {
                return res.status(401).json({
                    msg: 'Hable con el administrador, usuario bloqueado'
                });
            }
    
            // Generar el JWT
            const token = await generarJWT( usuario.idUser );
            
            res.json({
                usuario,
                token
            });
            
        } catch (error) {
            console.log('Error al crear el usuario de google')
            
        }     
        
    } catch (error) {
        res.status(400).json({
            msg: 'Proceso de Token de Google no es válido'
        })

    }
}

module.exports = {
    login,
    googleSignin
}