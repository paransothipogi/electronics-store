class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  // Search functionality
  search() {
    const keyword = this.queryStr.search
      ? {
          $or: [
            {
              name: {
                $regex: this.queryStr.search,
                $options: 'i'
              }
            },
            {
              description: {
                $regex: this.queryStr.search,
                $options: 'i'
              }
            },
            {
              brand: {
                $regex: this.queryStr.search,
                $options: 'i'
              }
            }
          ]
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  // Filter functionality
  filter() {
    const queryCopy = { ...this.queryStr };

    // Remove fields from query
    const removeFields = ['search', 'sort', 'page', 'limit', 'fields'];
    removeFields.forEach((key) => delete queryCopy[key]);

    // Advanced filter for price range
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (key) => `$${key}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  // Pagination functionality
  pagination(resultsPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resultsPerPage * (currentPage - 1);

    this.query = this.query.limit(resultsPerPage).skip(skip);
    return this;
  }

  // Sort functionality
  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // Field limiting
  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
}

module.exports = APIFeatures;
