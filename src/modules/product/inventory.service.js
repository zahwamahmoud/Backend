import { productModel } from "../product/product.model.js";
import { stockLogModel } from "../stockLogs/stockLog.model.js";

/**
 * Update product stock and record movement in StockLog.
 * @param {string} productId - Product ID
 * @param {string} companyId - Company ID
 * @param {number} quantity - Quantity to move
 * @param {string} type - 'in' or 'out'
 * @param {string} permissionId - ID of the document triggering the movement (Requisition or Transaction)
 * @param {string} userId - User ID who performed the action
 * @param {number} purchasePrice - Actual purchase price (required for 'in' to calculate WAC)
 * @param {object} session - Mongoose session for transactions
 */
export async function updateProductStock({
    productId,
    companyId,
    quantity,
    type,
    permissionId,
    userId,
    purchasePrice = null,
    session = null
}) {
    const product = await productModel.findOne({ _id: productId, companyId }).session(session);
    if (!product) throw new Error("Product not found");

    const prevQty = product.stockQuantity || 0;

    // Update stock and average cost using the product method
    await product.updateStock(quantity, type === 'in' ? 'add' : 'subtract', purchasePrice);
    const newQty = product.stockQuantity;

    // Record the log
    const log = await stockLogModel.create(
        [
            {
                companyId,
                product: productId,
                permission: permissionId,
                type: type,
                quantity: quantity,
                previousQuantity: prevQty,
                newQuantity: newQty,
                createdBy: userId,
            },
        ],
        { session }
    );

    return { product, log };
}
