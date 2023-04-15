/* eslint-disable import/no-anonymous-default-export */
import React, { Component } from "react";
import EditorComponent from "../components/Editor/EditorComponent";
import axios from "axios";
// automatically reconnects if the connection is closed
import ReconnectingWebSocket from "reconnecting-websocket";
import shareDB from "sharedb/lib/client";
import StringBinding from "../editorbinding/StringBinding";
import Loader from "../components/Loader/Loading";
import { notification } from "antd";
import { useParams } from "react-router-dom";
import { backendURL } from "../utils/config";
import { websockURL } from "../utils/config";

const serverURL = backendURL;
const websocketURL = websockURL;

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code: "",
      input: "",
      output: "",
      lang: "cpp",
      editor: null,
      monaco: null,
      binding: null,
      runCodeDisabled: false,
      isLoading: true,
    };
  }

  componentDidMount() {
    const { id } = this.props.params;
    axios
      .post(serverURL + "/code", {
        id: id,
      })
      .then((res) => {
        //open websocket connection to shareDB server
        const rws = new ReconnectingWebSocket(websocketURL + "/bar");
        const connection = new shareDB.Connection(rws);
        //create local doc instance mapped to 'examples' collection document with id 'textarea'
        const doc = connection.get("examples", id);

        doc.subscribe((err) => {
          if (err) throw err;
          const presence = connection.getPresence("examples");
          presence.subscribe((err) => {
            if (err) throw err;
          });
          let localPresence = presence.create();

          let binding = new StringBinding(
            this,
            doc,
            ["content"],
            localPresence
          );
          this.setState({ binding, isLoading: false }, () =>
            console.log("binding set")
          );
          binding.setup(this);

          presence.on("receive", (id, range) => {
            if (!range) return;
            let isPos =
              range.startLineNumber === range.endLineNumber &&
              range.startColumn === range.endColumn;
            binding.decorations = this.state.editor.deltaDecorations(
              binding.decorations,
              [
                {
                  range: new this.state.monaco.Range(
                    range.startLineNumber,
                    range.startColumn,
                    range.endLineNumber,
                    range.endColumn
                  ),
                  options: {
                    className: isPos ? "cursor-position" : "cursor-selection",
                  },
                },
              ]
            );
            console.log(this.state.editor.getModel().getAllDecorations())
            binding.range = range;
          });
        });
      })
      .catch((err) => {
        console.log(err);
        notification.error({
          message: err.toString(),
        });
      });
  }

  editorDidMount = (editor, monaco) => {
    console.log("editor mount", this.state);
    editor.focus();
    // Set end of line preference
    editor.getModel().pushEOL(0);

    let setup = true;
    editor.onDidChangeCursorSelection((e) => {
      console.log("cursor change");
      // Setup initial cursor position
      if (setup) {
        let pos = editor.getPosition();
        editor.setSelection(
          new monaco.Range(
            pos.lineNumber,
            pos.column,
            pos.lineNumber,
            pos.column
          )
        );
        setup = false;
        return;
      }
      // console.log(e);
      if (this.state.binding.localPresence) {
        this.state.binding.localPresence.submit(e.selection, (err) => {
          if (err) throw err;
        });
      }
    });

    this.setState({ editor, monaco });
  };

  // Monaco editor onChange()
  editorOnChange = (newValue, e) => {
    console.log(this.state.binding);
    this.state.binding._inputListener(newValue, e);
    this.setState({ code: newValue });
  };

  // Handler for Run Code button
  handleRun = () => {
    this.setState({ runCodeDisabled: true });
    // Convert array of codes into a single string
    const code = this.state.editor.getValue();
    // Send API call to run code
    axios
      .post(serverURL + "/code/run", {
        code: code,
        input: this.state.input,
        id: this.props.params.id,
        lang: this.state.lang,
        // lang: this.state.editor.getModel().getLanguageIdentifier().language, 
      })
      .then((response) => {
        this.state.binding._inoutListener(
          this.state.output,
          response.data,
          "output"
        );
        this.setState({ output: response.data, runCodeDisabled: false });
      })
      .catch((err) => {
        if (!err.response) {
          notification.error({
            message: err.toString(),
          });
          this.setState({ runCodeDisabled: false });
        } else if (err.response.status === 400) {
          this.state.binding._inoutListener(
            this.state.output,
            err.response.data,
            "output"
          );
          this.setState({ output: err.response.data, runCodeDisabled: false });
        }
      });
  };

  handleInput = (e) => {
    this.state.binding._inoutListener(
      this.state.input,
      e.target.value,
      "input"
    );
    this.setState({ input: e.target.value });
  };

  handleLang = (value) => {
    this.state.binding._inoutListener(this.state.lang, value, "lang");
    this.setState({ lang: value });
  };


  render() {
    const {
      lang,
      code,
      input,
      output,
      runCodeDisabled,
      isLoading,
    } = this.state;
    return (
      <React.Fragment>
        {isLoading && <Loader />}
        <EditorComponent
          lang={lang}
          code={code}
          input={input}
          output={output}
          runCodeDisabled={runCodeDisabled}
          readOnly={isLoading}
          editorDidMount={this.editorDidMount}
          editorOnChange={this.editorOnChange}
          handleLang={this.handleLang}
          handleRun={this.handleRun}
          handleInput={this.handleInput}
        />
      </React.Fragment>
    );
  }
}

export default (props) => (
    <Editor
      {...props}
      params={useParams()}
    />
  );