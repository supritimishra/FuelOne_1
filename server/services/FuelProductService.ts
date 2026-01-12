import { FuelProduct } from '../models/FuelProduct.js';
import mongoose from 'mongoose';

export class FuelProductService {
    /**
     * Resolves a fuel product by ID or shortCode (HSD, MS, XP).
     * Case-insensitive for shortCode.
     */
    static async resolveProduct(query: string, tenantId: string) {
        if (!query || !tenantId) return null;

        // 1. Try by ObjectId if valid
        if (mongoose.Types.ObjectId.isValid(query)) {
            const product = await FuelProduct.findOne({ _id: query, tenantId });
            if (product) return product;
        }

        // 2. Try by shortName (exact or case-insensitive)
        const productByShort = await FuelProduct.findOne({
            tenantId,
            $or: [
                { shortName: query },
                { shortName: query.toUpperCase() }
            ],
            isActive: true
        });

        if (productByShort) return productByShort;

        // 3. Try by productName (exact or case-insensitive)
        const productByName = await FuelProduct.findOne({
            tenantId,
            $or: [
                { productName: query },
                { productName: new RegExp(`^${query}$`, 'i') }
            ],
            isActive: true
        });

        return productByName;
    }

    /**
     * Ensures default fuel products exist for a tenant.
     */
    static async ensureDefaults(tenantId: string) {
        const count = await FuelProduct.countDocuments({ tenantId });
        if (count === 0) {
            console.log(`🌱 Seeding default Fuel Products for tenant ${tenantId}...`);
            await FuelProduct.insertMany([
                { tenantId, productName: "High Speed Diesel", shortName: "HSD", salesType: "Fuel", isActive: true },
                { tenantId, productName: "Motor Spirit", shortName: "MS", salesType: "Fuel", isActive: true },
                { tenantId, productName: "Xtra Premium", shortName: "XP", salesType: "Fuel", isActive: true }
            ]);
            return true;
        }
        return false;
    }

    /**
     * Returns all active fuel products for a tenant.
     */
    static async getActiveProducts(tenantId: string) {
        return await FuelProduct.find({ tenantId, isActive: true });
    }

    /**
     * Creates or updates a fuel product with snake_case to camelCase mapping.
     */
    static async createOrUpdate(id: string | null, data: any, tenantId: string) {
        const payload = {
            tenantId,
            productName: (data.product_name || data.productName || "").trim(),
            shortName: (data.short_name || data.shortName || "").trim(),
            wgtPercentage: Number(data.wgt_percentage || data.wgtPercentage || 0),
            tdsPercentage: Number(data.tds_percentage || data.tdsPercentage || 0),
            gstPercentage: Number(data.gst_percentage || data.gstPercentage || 0),
            lfrn: String(data.lfrn !== undefined ? data.lfrn : "0"),
            isActive: data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : true)
        };

        if (!payload.productName) throw new Error("Product name is required");
        if (!payload.shortName) throw new Error("Short name is required");

        if (id && mongoose.Types.ObjectId.isValid(id)) {
            return await FuelProduct.findOneAndUpdate({ _id: id, tenantId }, payload, { new: true });
        } else {
            return await FuelProduct.create(payload);
        }
    }

    /**
     * Deactivates a fuel product (Soft delete).
     */
    static async deactivate(id: string, tenantId: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await FuelProduct.findOneAndUpdate({ _id: id, tenantId }, { isActive: false }, { new: true });
    }
}
