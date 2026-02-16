
// export const validation = (schema) => {

//     return (req, res, next) => {
//         let inputs = { ...req.body, ...req.params, ...req.query }
//         let { error } = schema.validate(inputs, { abortEarly: false })
//         console.log(error);
//         if (!error) {
//             next()
//         } else {
//             res.status(400).json({ message: error.details.map((err) => err.message) })
//         }
//     }
// }





export const validation = (schema) => {
    return async (req, res, next) => {
        try {
            let inputs = { ...req.body, ...req.params, ...req.query };
            // { abortEarly: false, convert: true } ensures strings from FormData are converted to numbers/booleans
            await schema.validateAsync(inputs, { abortEarly: false, convert: true, allowUnknown: true });
            next();
        } catch (error) {
            console.error('[VALIDATION ERROR]:', error.details ? error.details.map(err => err.message) : error.message);
            const message = error.details
                ? error.details.map(err => err.message).join('; ')
                : (error.message || 'Validation failed');
            console.warn(`[Validation 400] ${req.method} ${req.url} -`, message);
            res.status(400).json({ message });
        }
    }
}
