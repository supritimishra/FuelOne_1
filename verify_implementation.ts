import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5002/api';

async function verify() {
    console.log("🚀 Starting Verification...");

    try {
        // 1. Fuel Products
        console.log("\n1️⃣ Verifying Fuel Products...");
        const fpRes = await fetch(`${BASE_URL}/fuel-products`);
        const fpData: any = await fpRes.json();
        if (fpData.ok && fpData.data.length > 0) {
            console.log("✅ Fuel Products OK:", fpData.data.map((p: any) => p.shortName).join(", "));
        } else {
            console.error("❌ Fuel Products Failed:", fpData);
        }

        // 2. Daily Rates
        console.log("\n2️⃣ Verifying Daily Rates...");
        const drPayload = {
            date: "2025-12-30",
            shift: "S-1",
            rates: [{ fuelProductId: "HSD", shortName: "HSD", openRate: 90, closeRate: 90 }]
        };
        const drRes = await fetch(`${BASE_URL}/daily-rates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(drPayload)
        });
        const drData: any = await drRes.json();
        if (drData.ok) {
            console.log("✅ Daily Rates Saved OK");
        } else if (drData.error?.includes("already exists")) {
            console.log("✅ Daily Rates Duplicate Check OK (Already exists)");
        } else {
            console.error("❌ Daily Rates Failed:", drData);
        }

        // 3. Business Transactions
        console.log("\n3️⃣ Verifying Business Transactions...");
        const btPayload = {
            transaction_date: "2025-12-30",
            transaction_type: "Debit",
            party_name: "Verification Party",
            amount: 500,
            description: "Auto verified"
        };
        const btRes = await fetch(`${BASE_URL}/business-transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(btPayload)
        });
        const btData: any = await btRes.json();
        if (btData.ok) {
            console.log("✅ Business Transaction Saved OK");
        } else {
            console.error("❌ Business Transaction Failed:", btData);
        }

        // 4. Vendors
        console.log("\n4️⃣ Verifying Vendors...");
        const vRes = await fetch(`${BASE_URL}/vendors`);
        const vData: any = await vRes.json();
        let vendorId = null;
        if (vData.ok && vData.rows.length > 0) {
            vendorId = vData.rows[0].id;
            console.log("✅ Vendors List OK. Using Vendor ID:", vendorId);
        } else {
            console.error("❌ Vendors List Empty or Failed:", vData);
        }

        // 5. Vendor Transactions
        if (vendorId) {
            console.log("\n5️⃣ Verifying Vendor Transactions...");
            const vtPayload = {
                transaction_date: "2025-12-30",
                vendor_id: vendorId,
                transaction_type: "Credit",
                amount: 1000,
                payment_mode: "Cash",
                description: "Vendor Verified"
            };
            const vtRes = await fetch(`${BASE_URL}/vendor-transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vtPayload)
            });
            const vtData: any = await vtRes.json();
            if (vtData.ok) {
                console.log("✅ Vendor Transaction Saved OK");
            } else {
                console.error("❌ Vendor Transaction Failed:", vtData);
            }
        } else {
            console.warn("⚠️ Skipping Vendor Transaction verification due to missing vendor.");
        }

    } catch (error) {
        console.error("❌ Verification Script Error:", error);
    }
}

verify();
