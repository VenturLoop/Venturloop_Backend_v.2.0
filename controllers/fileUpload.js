export const fileUpload = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res
      .status(403)
      .json({ status: false, error: "Please upload a file" });
  }

  const data = req.files.map((file) => ({
    url: file.location,
    type: file.mimetype,
  }));

  try {
    res.send({
      data: data,
      status: true,
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

