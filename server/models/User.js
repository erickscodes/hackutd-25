import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, index: true },
  phone: String,
});
export default mongoose.model("User", UserSchema);
