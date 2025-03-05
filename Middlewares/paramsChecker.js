class ParamsChecker {
    static async checkExistance(req, res, next, params) {
        try {
            for (const data in params) {
                if (req.method === 'GET' && data === 'body') {
                    return res.status(500).json({
                        message: 'Use query parameters instead of body for GET requests (ParamsConfigError)'
                    })
                }

                for (const key in params[data]) {
                    if (!req[data][params[data][key]]) {
                        return res.status(400).json({
                            message: `Missing ${params[data][key]} in ${data}`
                        })
                    }
                }
            }
        } catch (error) {
            return res.status(500).json({
                message: 'Internal server error (ParamsChecker)'
            })
        }

        return next()
    }
}

export default ParamsChecker