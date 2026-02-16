import { quoteModel } from "./quotes.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const addQuote = catchAsyncError(async (req, res, next) => {
    // req.body.companyId comes from middleware
    const quote = new quoteModel({
        ...req.body,
        companyId: req.body.companyId
    });
    await quote.save();

    if (!quote) {
        return next(new AppError('Quote not added', 400));
    }

    res.status(201).json({ message: 'Quote added successfully', quote });
});

const getAllQuotes = catchAsyncError(async (req, res, next) => {
    const quotes = await quoteModel.find(req.companyFilter).populate('customer').populate('items.product');
    res.status(200).json({ message: 'Quotes fetched successfully', quotes });
});

const getQuoteById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const quote = await quoteModel.findOne({ _id: id, ...req.companyFilter }).populate('customer').populate('items.product');

    if (!quote) {
        return next(new AppError('Quote not found', 404));
    }

    res.status(200).json({ message: 'Quote fetched successfully', quote });
});

const updateQuote = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const quote = await quoteModel.findOneAndUpdate(
        { _id: id, ...req.companyFilter },
        req.body,
        { new: true }
    );

    if (!quote) {
        return next(new AppError('Quote not updated', 400));
    }

    res.status(200).json({ message: 'Quote updated successfully', quote });
});

const deleteQuote = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const quote = await quoteModel.findOneAndDelete({ _id: id, ...req.companyFilter });

    if (!quote) {
        return next(new AppError('Quote not deleted', 400));
    }

    res.status(200).json({ message: 'Quote deleted successfully', quote });
});

export { addQuote, getAllQuotes, getQuoteById, updateQuote, deleteQuote };
