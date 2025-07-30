import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  _id:{
    type:String,
    required:true
  }, 
  content:{
    type:String,
    default:"",
  },
  // title:{
  //   type:String,
  //   default:"",
  //   required:true,
  // },
  history: [
    {
      type: { type: String, enum: ["insert", "delete"], required:true },
      index:{type: Number, required: true },
      text: { type: String, default: "" },
      length: { type: Number, required: function () { return this.type === "delete"; } }
    },
  ],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Document", documentSchema);
