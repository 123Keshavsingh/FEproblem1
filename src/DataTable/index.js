import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Popconfirm, Button, Space, Form, Input } from "antd";
import { isEmpty } from "lodash";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";

const DataTable = () => {
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [sortedInfo, setSortedInfo] = useState({});
  const [selecteRows, setSelectedRows] = useState([]);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [searchColText, setSearchColText] = useState("");
  const [searchedCol, setSearchedCol] = useState("");
  let [filteredInfo, setFilteredInfo] = useState({});
  let [filteredData] = useState();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const response = await axios.get(
      "https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json"
    );
    setGridData(response.data);
    setLoading(false);
  };
  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(selectedRows, "selectedRows...");
      setSelectedRows(selectedRows);

      console.log(
        `selectedRowKeys: ${selectedRowKeys}`,
        "selectedRows: ",
        selectedRows
      );
    },
    getCheckboxProps: (record) => ({
      disabled: record.name === "Disabled User",
      // Column configuration not to be checked
      name: record.name,
    }),
  };

  const handleDelete = (value) => {
    console.log(selecteRows);
    const dataSource = [...modifiedData];
    const filteredData = dataSource.filter((item) => item.id !== value.id);
    setGridData(filteredData);
  };
  const handleSelectedRowsDeletion = () => {
    const dataSource = [...modifiedData];
    const filteredData = dataSource.filter((ad) =>
      selecteRows.every((fd) => fd.id !== ad.id)
    );
    setGridData(filteredData);
  };

  const modifiedData = gridData.map(({ body, ...item }) => ({
    ...item,
    key: item.id,
    age: Math.floor(Math.random() * 6) + 20,
    comment: isEmpty(body) ? item.comment : body,
  }));

  console.log("modifiedData", modifiedData);

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 0, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleResetCol(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : "",
    render: (text) =>
      searchedCol === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchColText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const handleSearchCol = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchColText(selectedKeys[0]);
    setSearchedCol(dataIndex);
  };

  const handleResetCol = (clearFilters) => {
    clearFilters();
    setSearchColText("");
  };

  const edit = (record) => {
    form.setFieldsValue({
      name: "",
      email: "",
      comment: "",
      ...record,
    });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey("");
  };

  const handleChange = (_, filters, sorter) => {
    console.log("sorter", sorter);
    console.log("filters", filters);
    const { order, field } = sorter;
    setFilteredInfo(filters);
    setSortedInfo({ columnKey: field, order });
  };

  console.log("filteredInfo", filteredInfo);

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...modifiedData];
      const index = newData.findIndex((item) => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setGridData(newData);
        setEditingKey("");
      }
    } catch (error) {
      console.log("Error", error);
    }
  };

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    record,
    children,
    ...restProps
  }) => {
    const input = <Input />;
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{
              margin: 0,
            }}
            rules={[
              {
                required: true,
                message: `Please input ${title}`,
              },
            ]}
          >
            {input}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      align: "center",
      editable: true,
      ...getColumnSearchProps("name"),
    },
    {
      title: "Email",
      dataIndex: "email",
      align: "center",
      editable: true,
      ...getColumnSearchProps("email"),
    },
    {
      title: "Role",
      dataIndex: "role",
      align: "center",
      editable: true,
      ...getColumnSearchProps("email"),
    },

    {
      title: "Actions",
      dataIndex: "actions",
      align: "center",
      render: (_, record) => {
        const editable = isEditing(record);
        return modifiedData.length >= 1 ? (
          <Space>
            <Popconfirm
              title="Sure to delete?"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="primary" disabled={editable} danger>
                Delete
              </Button>
            </Popconfirm>
            {editable ? (
              <span>
                <Space size="middle">
                  <Button
                    onClick={(e) => save(record.key)}
                    type="primary"
                    style={{ marginRight: 8 }}
                  >
                    Save
                  </Button>
                  <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
                    <Button>Cancel</Button>
                  </Popconfirm>
                </Space>
              </span>
            ) : (
              <Button onClick={() => edit(record)} type="primary">
                Edit
              </Button>
            )}
          </Space>
        ) : null;
      },
    },
  ];
  const [selectionType, setSelectionType] = useState("checkbox");

  const isEditing = (record) => {
    return record.key === editingKey;
  };

  const clearAll = () => {
    setSortedInfo({});
    setFilteredInfo({});
    setSearchText("");
    loadData();
  };

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const handleSearch = (e) => {
    setSearchText(e.target.value);
    if (e.target.value === "") {
      loadData();
    }
  };
  const globalSearch = () => {
    filteredData = modifiedData.filter((value) => {
      return (
        value.name.toLowerCase().includes(searchText.toLowerCase()) ||
        value.email.toLowerCase().includes(searchText.toLowerCase()) ||
        value.role.toLowerCase().includes(searchText.toLowerCase())
      );
    });
    setGridData(filteredData);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Enter Search Text"
          onChange={handleSearch}
          type="text"
          allowClear
          value={searchText}
        />
        <Button type="primary" onClick={globalSearch}>
          Search
        </Button>
        <Button onClick={clearAll}>Clear All</Button>
      </Space>
      <Form form={form} component={false}>
        <Table
          rowSelection={{
            type: selectionType,
            ...rowSelection,
          }}
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          columns={mergedColumns}
          dataSource={
            filteredData && filteredData.length ? filteredData : modifiedData
          }
          bordered
          loading={loading}
          onChange={handleChange}
        />
        <Button
          style={{ marginBottom: "2%" }}
          type="primary"
          danger
          onClick={handleSelectedRowsDeletion}
        >
          Delete Selected
        </Button>
      </Form>
    </div>
  );
};

export default DataTable;
