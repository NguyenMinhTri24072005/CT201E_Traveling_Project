import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import TourCard from "../../components/common/TourCard";
import "./TourList.css";
export default function TourList() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [locRes, catRes] = await Promise.all([
          axiosClient.get("/locations"),
          axiosClient.get("/categories"),
        ]);
        setLocations(locRes.data);
        setCategories(catRes.data);
      } catch (error) {
        console.error("Lỗi lấy danh mục filter:", error);
      }
    };
    fetchFilters();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priceRange, selectedLocation, selectedCategory]);
  useEffect(() => {
    fetchTours();
  }, [currentPage, searchTerm, priceRange, selectedLocation, selectedCategory]);
  const fetchTours = async () => {
    try {
      setLoading(true);
      let minPrice = "";
      let maxPrice = "";
      if (priceRange === "under5") {
        maxPrice = 5000000;
      } else if (priceRange === "5to10") {
        minPrice = 5000000;
        maxPrice = 10000000;
      } else if (priceRange === "over10") {
        minPrice = 10000000;
      }
      const params = {
        page: currentPage,
        limit: 9,
        search: searchTerm,
        minPrice,
        maxPrice,
        location: selectedLocation !== "ALL" ? selectedLocation : "",
        category: selectedCategory !== "ALL" ? selectedCategory : "",
      };
      const res = await axiosClient.get("/tours", { params });
      setTours(res.data.tours);
      setTotalPages(res.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi lấy danh sách tour:", error);
      setLoading(false);
    }
  };
  return (
    <div className="tour-list-page fade-in">
      <div className="tour-header-banner">
        <h1>Khám Phá Các Chuyến Đi</h1>
        <p>Tìm kiếm hành trình tuyệt vời nhất dành cho bạn</p>
      </div>
      <div className="tour-list-container">
        <div className="tour-sidebar">
          <div className="filter-group">
            <h3>Tìm kiếm</h3>
            <input
              type="text"
              placeholder="Nhập tên tour hoặc địa điểm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <h3>Điểm đến nổi bật</h3>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Tất cả điểm đến</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <h3>Danh mục Tour</h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <h3>Mức giá</h3>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="price"
                  value="ALL"
                  checked={priceRange === "ALL"}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                Tất cả mức giá
              </label>
              <label>
                <input
                  type="radio"
                  name="price"
                  value="under5"
                  checked={priceRange === "under5"}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                Dưới 5.000.000₫
              </label>
              <label>
                <input
                  type="radio"
                  name="price"
                  value="5to10"
                  checked={priceRange === "5to10"}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                5.000.000₫ - 10.000.000₫
              </label>
              <label>
                <input
                  type="radio"
                  name="price"
                  value="over10"
                  checked={priceRange === "over10"}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                Trên 10.000.000₫
              </label>
            </div>
          </div>
        </div>
        <div className="tour-grid-section">
          {loading ? (
            <div className="loading-spinner">Đang tải danh sách tour...</div>
          ) : tours.length === 0 ? (
            <div className="no-tour-found">
              <h3>
                Không tìm thấy tour phù hợp{" "}
                <i className="fa-solid fa-face-frown"></i>
              </h3>
              <p>Vui lòng thử lại với từ khóa hoặc mức giá khác.</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setPriceRange("ALL");
                  setSelectedLocation("ALL");
                  setSelectedCategory("ALL");
                }}
                className="btn-reset"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="tour-grid">
                {tours.map((tour) => (
                  <TourCard key={tour._id} tour={tour} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    &laquo; Trước
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={currentPage === i + 1 ? "active" : ""}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    Sau &raquo;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
