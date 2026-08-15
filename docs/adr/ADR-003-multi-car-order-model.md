# ADR-003: Multi-Vehicle Order Relational Architecture

## Status
**ACCEPTED**

## Context
Customers in Dubai frequently book simultaneous detailing for multiple vehicles at the same location (e.g. 1 Sedan and 1 SUV). Different car types have different prices, durations, and require independent add-on configurations and photo inspection sets.

## Decision
We separate the booking structure into a normalized **Master Order (`orders`) and Vehicle Order Items (`order_items`)** pattern.

- `orders`: Holds global dispatch parameters (Customer, Assigned Specialist, Delivery Location, Payment Status, Subtotal, Discount, Tip).
- `order_items`: Holds vehicle-specific detailing tasks (Vehicle ID, Car Type, Base Service, Add-ons Total, Washing Status, Start/End timestamps).
- `vehicle_inspection_photos`: Foreign-keyed directly to `order_items(id)` to enforce per-vehicle Before and After photo collections.

## Consequences
### Positive:
- **Clean Separation of Concerns**: Specialist can wash cars sequentially, marking Car 1 finished while Car 2 is in progress.
- **Accurate Financials**: Precise itemized pricing for heterogeneous car types in a single checkout.
- **Independent Quality Audit**: Inspection photos strictly tied to the respective vehicle.

### Negative:
- Minor additional query complexity (requires joining `order_items` and `order_item_addons` when fetching order details).
