/**
 * Parses req.body.entries from JSON string to array when sent via FormData.
 * Accepts single object or array; normalizes to array for validation.
 * Must run after uploadSingleFile and before validation.
 */
export const parseJournalEntries = (req, res, next) => {
    if (!req.body) return next();

    if (typeof req.body.entries === 'string') {
        try {
            req.body.entries = JSON.parse(req.body.entries);
        } catch (e) {
            return res.status(400).json({ message: 'Invalid entries format' });
        }
    }

    // Normalize: single object -> array with one element
    if (req.body.entries && !Array.isArray(req.body.entries)) {
        req.body.entries = [req.body.entries];
    }

    next();
};
